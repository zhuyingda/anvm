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
const { exec } = require('child_process');
const fs = require('fs')

function cli(cmd) {
  return new Promise(resolve => {
    exec(cmd, (err, stdout, stderr) => {
      if (err) {
        resolve({
          err
        });
      }
      else {
        resolve({
          stdout,
          stderr
        });
      }

    });
  });
};

exports.unfoldTar = async function (tarFilePath, destDirPath) {
  const cp = await cli(`tar zxf ${tarFilePath} -C ${destDirPath}`);
  if (cp.stderr || cp.err) {
    console.error(cp.stderr || cp.err);
    throw new Error('unfold tar error');
  }
  return true;
};

function isSymExists(symLinkPath) {
  try {
    const realFile = fs.readlinkSync(symLinkPath);
    if (realFile) {
      return true;
    }
  }
  catch (err) {}
  return false
}

exports.symbolLink = async function (srcFilePath, symLinkPath) {
  if (isSymExists(symLinkPath)) {
    fs.unlinkSync(symLinkPath);
  }
  fs.symlinkSync(srcFilePath, symLinkPath);
};

exports.getNodeDirName = function (filePath) {
  const pathSplit = filePath.split('/');
  const tarName = pathSplit[pathSplit.length - 1];
  const nodeDirName = tarName.replace(/\.tar\.gz$/, '');
  return nodeDirName;
};