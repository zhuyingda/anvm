const assert = require('assert');
const proxyquire = require('proxyquire');

describe('test file module', () => {
  const pool = {
    exist: false,
    unlink: null,
    srcLink: null,
    destLink: null
  };

  const stub = {
    'child_process': {
      exec: (cmd, cb) => {
        pool.exec = cmd;
        cb(null, '');
      }
    },
    'fs': {
      readlinkSync: (file) => {
        return pool.exist;
      },
      unlinkSync: (file) => {
        pool.unlink = file;
        return true;
      },
      symlinkSync: (srcLink, destLink) => {
        pool.srcLink = srcLink;
        pool.destLink = destLink;
        return true;
      }
    }
  };
  
  const { unfoldTar, symbolLink, getNodeDirName } = proxyquire('../lib/file', stub);

  it('unfold tar package', async () => {
    const srcFile = '/path/to/src.tar.gz';
    const destFile = '/path/to/dest/';
    const ret = await unfoldTar(srcFile, destFile);
    assert.equal(pool.exec, `tar zxf ${srcFile} -C ${destFile}`);
    assert.equal(ret, true);
  });

  it('symbol link once', async () => {
    const srcFile = '/path/to/srcfile';
    const sLink = '/path/to/slink';
    await symbolLink(srcFile, sLink);
    assert.equal(pool.unlink, null);
    assert.equal(pool.srcLink, srcFile);
    assert.equal(pool.destLink, sLink);
  });

  it('symbol link multiple times', async () => {
    const srcFile = '/path/to/srcfile2';
    const sLink = '/path/to/slink2';
    pool.exist = true;
    await symbolLink(srcFile, sLink);
    assert.equal(pool.unlink, sLink);
    assert.equal(pool.srcLink, srcFile);
    assert.equal(pool.destLink, sLink);
  });

  it('getNodeDirName function', () => {
    assert.equal(getNodeDirName('/Users/zhuyingda/.anvm/gz_store/node-v12.4.0-darwin-x64.tar.gz'), 'node-v12.4.0-darwin-x64');
  });

});