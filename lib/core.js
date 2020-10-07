/**
 * Copyright (c) 2020 5u9ar (zhuyingda)
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
const inquirer = require('inquirer');
const path = require('path');
const fs = require('fs');
const { list, download } = require('./fetch');
const { unfoldTar, symbolLink, getNodeDirName } = require('./file');
const { log } = require('./print');

exports.install = async () => {
  log.info('Welcome to anvm~~~');
  const verList = await list();
  const verGroup = {};
  let selectList = [
    {
      type: 'list',
      name: 'majorVersion',
      message: 'Please select a major version...',
      choices: [],
    },
  ];
  let majorVer;
  verList.forEach(el => {
    const version = el.nodeVer.match(/(\d{1,2})\.\d{1,2}\.\d{1,2}/);
    majorVer = version[1] + '.x';
    if (!verGroup[majorVer]) {
      verGroup[majorVer] = [];
      selectList[0].choices.push(majorVer);
    }
    verGroup[majorVer].push(el);
  });

  const { majorVersion } = await query(selectList);
  selectList = {
    type: 'list',
    name: 'switchVersion',
    message: 'Please choose a version to switch...',
    choices: [],
  };
  verGroup[majorVersion].forEach(el => {
    selectList.choices.push(el.nodeVer);
  });
  const { switchVersion } = await query(selectList);
  let downloadUrl;
  verGroup[majorVersion].forEach(el => {
    if (el.nodeVer === switchVersion) {
      log.info('Target node version to switch:');
      log.text(el.nodeVer);
      log.text(`publish date: ${el.pubDate}`);
      log.text(`v8 version: ${el.v8Ver}`);
      log.text(`changelog url: ${el.changelogUrl}`);
      log.text(`docs url: ${el.docs}`);
      downloadUrl = el.downloadUrl;
    }
  });
  const { isOk } = await query({
    type: 'confirm',
    name: 'isOk',
    message: 'Do you want to switch?',
  });
  if (isOk) {
    const workSpace = path.resolve(process.env.HOME, '.anvm/');
    const pkgSpace = path.resolve(process.env.HOME, '.anvm/pkg_store/');
    const nodeBin = path.resolve(process.env.HOME, '.anvm/bin/node');
    if (!fs.existsSync(workSpace)) {
      fs.mkdirSync(workSpace);
      fs.mkdirSync(pkgSpace);
      fs.mkdirSync(path.resolve(process.env.HOME, '.anvm/bin/'));
    }
    log.info(`about to download ${pkgSpace}`);
    const file = await download(downloadUrl, pkgSpace);
    log.info(`file ${file} downloaded`);
    await unfoldTar(file, pkgSpace);
    log.info('untar file finished');
    const realNodeBin = path.resolve(pkgSpace, getNodeDirName(file), 'bin/node');
    log.info(`created symbol link from ${realNodeBin}`);
    await symbolLink(realNodeBin, nodeBin);
    log.info('done.');
    log.info(`now you can use nodejs by: ${nodeBin}`);
  }

};

function query(param) {
  return new Promise(resolve => {
    inquirer
      .prompt(param)
      .then((answers) => {
        resolve(answers);
      });
  });
}