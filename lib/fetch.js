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
const axios = require('axios').default;
const Fs = require('fs');
const Path = require('path');
const Os = require('os');
const { URL } = require('url');
const { startProgressFake, closeProgressFake } = require('./print');

exports.list = async function () {
  startProgressFake();
  const resp = await axios.get('https://nodejs.org/en/download/releases/');
  closeProgressFake();
  const html = resp.data;

  const tableTag = html.match(/<table\sid="tbVersions"\sclass="download\-table\sfull\-width">([\w|\W]+?)<\/table>/);
  if (!tableTag || !tableTag[1]) {
    throw new Error('get list failed: table tag missed');
  }

  const tbodyTag = tableTag[1].match(/<tbody>([\w|\W]+?)<\/tbody>/);
  if (!tbodyTag || !tbodyTag[1]) {
    throw new Error('get list failed: tbody tag missed');
  }

  const trList = tbodyTag[1].match(/<tr>([\w|\W]+?)<\/tr>/g);
  if (!trList) {
    throw new Error('get list failed: tr tags missed');
  }

  const output = [];
  for (let i = 0; i < trList.length; i++) {
    const curTr = trList[i];
    if (!curTr) {
      throw new Error('get list failed: tr tag missed');
    }

    let nodeVer = curTr.match(/<td data-label="Version">([\w|\W]+?)<\/td>/);
    if (!nodeVer || !nodeVer[1]) {
      throw new Error('get list failed: td version tag missed');
    }
    nodeVer = nodeVer[1].match(/\d+\.\d+\.\d+/);
    if (!nodeVer || !nodeVer[0]) {
      throw new Error('get list failed: invalid version tag content');
    }
    nodeVer = nodeVer[0];

    const pubDate = curTr.match(/<td\sdata-label="Date"><time>(\d{4}-\d{2}-\d{2})<\/time><\/td>/);
    if (!pubDate || !pubDate[1]) {
      throw new Error('get list failed: td date tag missed');
    }

    const v8Ver = curTr.match(/<td\sdata-label="V8">([\w|\W]+?)<\/td>/);
    if (!v8Ver || !v8Ver[1]) {
      throw new Error('get list failed: td v8 version tag missed');
    }

    const download = curTr.match(/<a\shref="(.+?)">\W*Releases\W*<\/a>/);
    if (!download || !download[1]) {
      throw new Error('get list failed: download url tag missed');
    }

    const changelog = curTr.match(/<a\shref="(.+?)">\W*Changelog\W*<\/a>/);
    if (!changelog || !changelog[1]) {
      throw new Error('get list failed: changelog url tag missed');
    }

    const docs = curTr.match(/<a\shref="(.+?)">\W*Docs\W*<\/a>/);
    if (!docs || !docs[1]) {
      throw new Error('get list failed: docs url tag missed');
    }

    output.push({
      nodeVer: nodeVer,
      pubDate: pubDate[1],
      v8Ver: v8Ver[1],
      downloadUrl: download[1],
      changelogUrl: changelog[1],
      docs: docs[1],
    });
  }

  return output;
};

exports.download = async function (downloadUrl, saveDirPath) {
  const pageResp = await axios.get(downloadUrl);
  const html = pageResp.data;

  const platform = Os.platform();
  const arch = Os.arch();

  let realDownloadUrl, fileName;
  if (platform === 'darwin') {
    if (arch === 'arm64') {
      fileName = html.match(/<a\s+href=["']((?:(?!<).)+?)["']>node-v\d+.\d+.\d+-darwin-arm64.tar.gz<\/a>/);
    }
    else {
      fileName = html.match(/<a\s+href=["']((?:(?!<).)+?)["']>node-v\d+.\d+.\d+-darwin-x64.tar.gz<\/a>/);
    }
  }
  else if (platform === 'linux') {
    if (arch === 'arm64') {
      fileName = html.match(/<a\s+href=["']((?:(?!<).)+?)["']>node-v\d+.\d+.\d+-linux-arm64.tar.gz<\/a>/);
    }
    else {
      fileName = html.match(/<a\s+href=["']((?:(?!<).)+?)["']>node-v\d+.\d+.\d+-linux-x64.tar.gz<\/a>/);
    }
  }
  else {
    throw new Error(`unsupport os ${platform} arch ${arch}`);
  }

  if (!fileName || !fileName[1]) {
    throw new Error('download failed: macos tar file missed');
  }

  const url = new URL(downloadUrl);
  realDownloadUrl = `${url.protocol}//${url.host}${fileName[1]}`;

  startProgressFake();
  const downloadResp = await axios({
    method: 'get',
    url: realDownloadUrl,
    responseType: 'stream'
  });

  if (!Fs.existsSync(saveDirPath)) {
    throw new Error('download failed: save dir not exists');
  }

  const nameArr = fileName[1].split('/');
  const tarFileName = nameArr[nameArr.length - 1];
  const tarFilePath = Path.resolve(saveDirPath, tarFileName);
  const wStream = Fs.createWriteStream(tarFilePath);
  const isOk = await writePipeSync(downloadResp.data, wStream);
  closeProgressFake();
  if (!isOk) {
    throw new Error('download failed: write downlaod tar file error');
  }
  return tarFilePath;
};

function writePipeSync(src, dest) {
  return new Promise(resolve => {
    src.pipe(dest);
    dest.on('finish', () => {
      resolve(true);
    });
    dest.on('error', (err) => {
      console.error(err);
      resolve(false);
    });
  });
}