'use strict';
/**
 * @file Unit tests for ShellStream
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
  fs: require('fs')
};
const chai = require('chai');
const expect = chai.expect;
const ShellStream = require('..');


describe('ShellStream', function () {
  const args = { command: 'cat', args: [] };


  describe('new', function () {
    it('should be callable', function () {
      expect(ShellStream).to.be.a('function');
    });

    it('should not be instantiable without arguments', function () {
      expect(() => new ShellStream()).to.throw();
      expect(() => new ShellStream(null)).to.throw();
      expect(() => new ShellStream({})).to.throw();
    });

    it('should be instantiable with required arguments', function () {
      expect(new ShellStream(args)).to.be.an.instanceOf(ShellStream);
    });
  });


  describe('streaming', function () {
    it('should emit `end` at the end', function (done) {
      const sh = new ShellStream(args)
        .on('error', done)
        .on('end', done);

      node.fs.createReadStream(__filename)
        .pipe(sh)
        .pipe(node.fs.createWriteStream('/dev/null'));
    });

    it('should emit `data` events', function (done) {
      let count = 0;
      const sh = new ShellStream(args)
        .on('data', () => count++)
        .on('end', () => {
          expect(count).to.be.greaterThan(0);
          done();
        });

      node.fs.createReadStream(__filename)
        .pipe(sh)
        .pipe(node.fs.createWriteStream('/dev/null'));
    });
  });
});
