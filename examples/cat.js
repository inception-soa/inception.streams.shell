'use strict';
/**
 * @file A shell-stream implementation of the UNIX cat(8) command
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

const ShellStream = require('..');
const useStdin = (process.argv.length <= 2);
const args = useStdin ? ['-'] : process.argv.slice(2);
const cat = new ShellStream({ command: 'cat', args: args });

if (useStdin) {
  process.stdin.pipe(cat);
}

cat.pipe(process.stdout);
cat.stderr.pipe(process.stderr);
