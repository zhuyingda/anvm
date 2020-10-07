const assert = require('assert');
const proxyquire = require('proxyquire');
const fs = require('fs');

describe('test fetch module', () => {
  describe('list function', () => {
    it('normal case', async () => {
      const { list } = proxyquire('../lib/fetch', {
        axios: {
          default: {
            get: (url) => {
              return {
                data: `<table class="download-table full-width">
                        <thead>
                          <tr>
                            <td>Version</td>
                            <td>LTS</td>
                            <td>Date</td>
                            <td>V8</td>
                            <td>npm</td>
                            <td>NODE_MODULE_VERSION<a href="#ref-1">[1]</a><span id="backref-1"></span></td>
                            <td></td>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td data-label="Version">Node.js 14.8.0</td>
                            <td data-label="LTS"></td>
                            <td data-label="Date"><time>2020-08-11</time></td>
                            <td data-label="V8">8.4.371.19</td>
                            <td data-label="npm">6.14.7</td>
                            <td data-label="NODE_MODULE_VERSION">83</td>
                            <td class="download-table-last">
                              <a href="https://nodejs.org/download/release/v14.8.0/">
                                Downloads
                              </a>
                              <a href="https://github.com/nodejs/node/blob/master/doc/changelogs/CHANGELOG_V14.md#14.8.0">
                                Changelog
                              </a>
                              <a href="https://nodejs.org/dist/v14.8.0/docs/api/">
                                Docs
                              </a>
                            </td>
                          </tr>
                        </tbody></table>`
              };
            }
          }
        }
      });
      const verList = await list();
      assert.equal(verList.length, 1);
      assert.equal(verList[0].nodeVer, 'Node.js 14.8.0');
      assert.equal(verList[0].pubDate, '2020-08-11');
      assert.equal(verList[0].v8Ver, '8.4.371.19');
      assert.equal(verList[0].downloadUrl, 'https://nodejs.org/download/release/v14.8.0/');
      assert.equal(verList[0].changelogUrl, 'https://github.com/nodejs/node/blob/master/doc/changelogs/CHANGELOG_V14.md#14.8.0');
      assert.equal(verList[0].docs, 'https://nodejs.org/dist/v14.8.0/docs/api/');
    });

    it('failed case', async () => {
      const { list } = proxyquire('../lib/fetch', {
        axios: {
          default: {
            get: (url) => {
              return {
                data: `<html><head></head><body></body></html>`
              };
            }
          }
        }
      });
      try {
        await list();
        assert.fail();
      } catch (err) {
        assert.equal(err.toString(), 'Error: get list failed: table tag missed');
      }
    });

    it('failed case', async () => {
      const { list } = proxyquire('../lib/fetch', {
        axios: {
          default: {
            get: (url) => {
              return {
                data: `<html><head></head><body><table class="download-table full-width">x</table></body></html>`
              };
            }
          }
        }
      });
      try {
        await list();
        assert.fail();
      } catch (err) {
        assert.equal(err.toString(), 'Error: get list failed: tbody tag missed');
      }
    });

    it('failed case', async () => {
      const { list } = proxyquire('../lib/fetch', {
        axios: {
          default: {
            get: (url) => {
              return {
                data: `<html><head></head><body><table class="download-table full-width"><tbody>x</tbody></table></body></html>`
              };
            }
          }
        }
      });
      try {
        await list();
        assert.fail();
      } catch (err) {
        assert.equal(err.toString(), 'Error: get list failed: tr tags missed');
      }
    });
  });

  describe('download function', () => {
    it('normal case', async () => {
      const stub = {
        axios: {
          default: () => {
            return new Promise(resolve => {
              resolve({
                data: {
                  pipe: () => {
                    // todo
                  }
                }
              })
            });
          }
        },
        fs: {
          existsSync: () => true,
          createWriteStream: () => {
            return {
              on: (evt, cb) => {
                if (evt === 'finish') {
                  setTimeout(() => {
                    cb();
                  }, 200);
                }
              }
            }
          }
        }
      };
      stub.axios.default.get = (url) => {
        const [ _, reqVer ] = url.match(/\/\/nodejs\.org\/download\/release\/([\w|\W]+)\/$/);
        const mockHtml = fs.readFileSync('./test/fetch-download.html', 'utf8');
        return {
          data: mockHtml.replace(/\$\{reqVer\}/g, reqVer)
        };
      };
      const { download } = proxyquire('../lib/fetch', stub);

      const version = 'v14.0.0';
      const expectSavePathDir = '/path/to/save/';
      const expectSavePath = expectSavePathDir + `node-${version}-darwin-x64.tar.gz`;
      const actualSavePath = await download(`https://nodejs.org/download/release/${version}/`, expectSavePathDir);
      assert.equal(actualSavePath, expectSavePath);
    });

    it('failed case', async () => {
      const stub = {
        axios: {
          default: () => {
            return new Promise(resolve => {
              resolve({
                data: {
                  pipe: () => {
                    // todo
                  }
                }
              })
            });
          }
        },
        fs: {
          existsSync: () => true,
          createWriteStream: () => {
            return {
              on: (evt, cb) => {
                if (evt === 'finish') {
                  setTimeout(() => {
                    cb();
                  }, 200);
                }
              }
            }
          }
        }
      };
      stub.axios.default.get = (url) => {
        return {
          data: `<html><head></head><body></body></html>`
        };
      };
      const { download } = proxyquire('../lib/fetch', stub);

      const version = 'v14.0.0';
      const expectSavePathDir = '/path/to/save/';
      try {
        await download(`https://nodejs.org/download/release/${version}/`, expectSavePathDir);
        assert.fail();
      } catch (err) {
        assert.equal(err.toString(), 'Error: download failed: macos tar file missed');
      }
    });

    it('failed case', async () => {
      const stub = {
        axios: {
          default: () => {
            return new Promise(resolve => {
              resolve({
                data: {
                  pipe: () => {
                    // todo
                  }
                }
              })
            });
          }
        },
        fs: {
          existsSync: () => false,
          createWriteStream: () => {
            return {
              on: (evt, cb) => {
                if (evt === 'finish') {
                  setTimeout(() => {
                    cb();
                  }, 200);
                }
              }
            }
          }
        }
      };
      stub.axios.default.get = (url) => {
        const [ _, reqVer ] = url.match(/\/\/nodejs\.org\/download\/release\/([\w|\W]+)\/$/);
        const mockHtml = fs.readFileSync('./test/fetch-download.html', 'utf8');
        return {
          data: mockHtml.replace(/\$\{reqVer\}/g, reqVer)
        };
      };
      const { download } = proxyquire('../lib/fetch', stub);

      const version = 'v14.0.0';
      const expectSavePathDir = '/path/to/save/';
      try {
        await download(`https://nodejs.org/download/release/${version}/`, expectSavePathDir);
        assert.fail();
      } catch (err) {
        assert.equal(err.toString(), 'Error: download failed: save dir not exists');
      }
    });

    it('failed case', async () => {
      const stub = {
        axios: {
          default: () => {
            return new Promise(resolve => {
              resolve({
                data: {
                  pipe: () => {
                    // todo
                  }
                }
              })
            });
          }
        },
        fs: {
          existsSync: () => true,
          createWriteStream: () => {
            return {
              on: (evt, cb) => {
                if (evt === 'error') {
                  setTimeout(() => {
                    cb();
                  }, 200);
                }
              }
            }
          }
        }
      };
      stub.axios.default.get = (url) => {
        const [ _, reqVer ] = url.match(/\/\/nodejs\.org\/download\/release\/([\w|\W]+)\/$/);
        const mockHtml = fs.readFileSync('./test/fetch-download.html', 'utf8');
        return {
          data: mockHtml.replace(/\$\{reqVer\}/g, reqVer)
        };
      };
      const { download } = proxyquire('../lib/fetch', stub);

      const version = 'v14.0.0';
      const expectSavePathDir = '/path/to/save/';
      try {
        await download(`https://nodejs.org/download/release/${version}/`, expectSavePathDir);
        assert.fail();
      } catch (err) {
        assert.equal(err.toString(), 'Error: download failed: write downlaod tar file error');
      }
    });

  });
});