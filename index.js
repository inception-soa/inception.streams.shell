'use strict';
/**
 * @file A stream-based wrapper for running external programs
 *
 * @author Anand Suresh <anandsuresh@gmail.com>
 * @copyright Copyright (C) 2017 Anand Suresh
 * @license Apache-2.0
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const node = {
  childProcess: require('child_process'),
  util: require('util')
};
const inception = {
  debug: require('inception.debug')('inception:streams:shell'),
  primitives: require('inception.primitives')
};


/**
 * A stream-based wrapper for running external programs
 *
 * @param {Object} opts Configuration options for the transcoder
 * @param {String} opts.command The command to run
 * @param {String[]} opts.args List of string arguments
 * @param {Object} opts.options Configuration options for the .spawn() method
 * @constructor
 */
function ShellStream (opts) {
  ShellStream.super_.call(this, opts);

  // Used to store the ._flush() callback parameter to wait until all required
  // data has been flushed.
  this._afterFlush = null;

  this._child = this._spawnChild();
  this._debug(`spawn ${this.command} ${this.args.join(' ')}`, this.options);
}
node.util.inherits(ShellStream, inception.primitives.stream.Transform);


/**
 * The command to run
 * @name ShellStream#command
 * @type {String}
 */
Object.defineProperty(ShellStream.prototype, 'command', {
  get: function () {
    return this._properties.command;
  }
});


/**
 * List of string arguments
 * @name ShellStream#args
 * @type {String}
 */
Object.defineProperty(ShellStream.prototype, 'args', {
  get: function () {
    return this._properties.args;
  }
});


/**
 * Configuration options for the .spawn() method
 * @name ShellStream#options
 * @type {String}
 */
Object.defineProperty(ShellStream.prototype, 'options', {
  get: function () {
    return this._properties.options;
  }
});


/**
 * The stderr stream
 * @name ShellStream#stderr
 * @type {String}
 */
Object.defineProperty(ShellStream.prototype, 'stderr', {
  get: function () {
    return this._child.stderr;
  }
});


/**
 * Initializes the child process
 *
 * @return {ChildProcess}
 */
ShellStream.prototype._spawnChild = function () {
  const child = node.childProcess.spawn(this.command, this.args, this.options);

  child
    .on('error', (err) => this._error(err))
    .on('exit', (code, signal) => this._debug(`exit with ${code}/${signal}`));

  child.stdin
    .on('error', (err) => this._error(err))
    .on('drain', () => {
      this._debug('uncork on stdin drain');
      this.uncork();
    })
    .on('finish', () => this._debug('stdin ended'));

  child.stdout
    .on('error', (err) => this._error(err))
    .on('data', (chunk) => {
      this._debug(`push ${chunk.length} bytes`);
      if (!this.push(chunk)) {
        child.stdout.pause();
      }
    })
    .on('end', () => {
      this._debug('stdout ended');
      this.push(null);
      if (typeof this._afterFlush === 'function') {
        this._afterFlush();
      }
    });

  this
    .on('drain', () => child.stdout.resume());

  return child;
};


/**
 * Overridden _transform() method of the Transform stream class
 *
 * @param {Buffer} chunk The chunk of data to be processed
 * @param {String} encoding The encoding of the chunk
 * @param {Function} callback The function to execute after processing the chunk
 */
ShellStream.prototype._transform = function (chunk, encoding, callback) {
  this._debug(`read ${chunk.length} byte ${encoding}`);
  if (!this._child.stdin.write(chunk, encoding, callback)) {
    this._debug('cork on stdin write');
    this.cork();
  }
};


/**
 * Overridden _flush() method of the Transform stream class
 *
 * @param {Function} callback The function to execute after flushing the stream
 */
ShellStream.prototype._flush = function (callback) {
  this._afterFlush = callback;
  this._child.stdin.end();
};


/**
 * Emits an error
 *
 * @param {Error} err The cause of the error
 */
ShellStream.prototype._error = function (err) {
  this._debug(`error: ${err}`);
  this.emit('error', err);
};


/**
 * Writes debug logging
 *
 * @param {String} msg The log message to output
 */
ShellStream.prototype._debug = function (msg) {
  inception.debug(`${this.command}[${this._child.pid}]: ${msg}`);
};


/**
 * Export the class
 * @type {ShellStream}
 */
module.exports = ShellStream;
