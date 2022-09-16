const WP_ROOT = "https://incredibletab.com/wpcdn/";
const DEFAULT_IMG_URL = "default.jpg";

const imgContainer = document.getElementById("background-image");
let imagesInfo = null;
const storage = new Storage();
const request = new CustomRequest();

const INFO_KEY = "[wpInfo]";
const CACHED_LIST_KEY = "[wpCached]";

changeImage();
document.getElementById("menu").addEventListener("click", changeImage);

function checkWpInfo() {
  return new Promise(async (resolve, reject) => {
    const data = await storage.get(INFO_KEY);
    if (data) {
      imagesInfo = data;
      resolve(data);
    }
    try {
      const response = await request.get(WP_ROOT + "wp.json");
      const info = JSON.parse(response);
      if (info?.length) {
        let data = [];
        for (let i = 0; i < info.length; i++) {
          let id = info[i].id.toString().trim();
          storage.set(info[i].id, WP_ROOT + id + ".jpg");
          data.push(id);
        }
        storage.set(INFO_KEY, data);
        resolve(data);
      }
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
}

async function cacheCurrentImage(id) {
  if (!id || imgContainer.src.substr(0, 4) != "http") return;
  const imgData = serializeImage(imgContainer);
  storage.set(id, imgData);
  let cachedList = await storage.get(CACHED_LIST_KEY);
  if (!cachedList) cachedList = [];
  cachedList.push(id);
  storage.set(CACHED_LIST_KEY, cachedList);
  console.log("image at " + id + " cached to storage");
}

function getRandomImage(info) {
  return new Promise(async (resolve, reject) => {
    const imgId = getRandomArrayElement(info);
    if (!imgId) reject();
    const imageUrl = await storage.get(imgId);
    if (imageUrl) {
      resolve({ imgId, imageUrl });
    }
    reject();
  });
}

async function getRandomCachedImage() {
  const info = await storage.get(CACHED_LIST_KEY);
  return await getRandomImage(info);
}
async function getRandomOnlineImage() {
  return await getRandomImage(imagesInfo);
}

function setImage(url) {
  return new Promise((resolve, reject) => {
    reanimateNode(imgContainer, "fade-in", "fade-out");
    imgContainer.onload = function () {
      alreadyLoaded = true;
      reanimateNode(imgContainer, "fade-out", "fade-in", true);
      resolve();
    };
    imgContainer.onerror = function () {
      reject();
    };
    setTimeout(function () {
      reject();
    }, 3500);
    imgContainer.src = url;
  });
}

function chooseAndCacheImage(cached) {
  return new Promise(async (resolve, reject) => {
    const getImageFunction = cached
      ? getRandomCachedImage
      : getRandomOnlineImage;
    const { imgId, imageUrl } = await getImageFunction();
    if (!imgId) return reject();
    setImage(imageUrl)
      .then(() => {
        if (!cached) cacheCurrentImage(imgId);
        resolve();
      })
      .catch(() => {
        reject();
      });
  });
}

function changeImage() {
  checkWpInfo()
    .then(() => {
      chooseAndCacheImage(false).catch(() => {
        chooseAndCacheImage(true).catch(() => {
          setImage(DEFAULT_IMG_URL, function () {});
        });
      });
    })
    .catch((error) => {
      console.error(error);
      setImage(DEFAULT_IMG_URL, function () {});
    });
}

function serializeImage(domNode) {
  const canvas = document.createElement("CANVAS");
  const ctx = canvas.getContext("2d");
  canvas.height = domNode.naturalHeight;
  canvas.width = domNode.naturalWidth;
  ctx.drawImage(domNode, 0, 0);
  return canvas.toDataURL("image/jpeg");
}

function reanimateNode(elem, from, to, force) {
  if (force || elem.classList.contains(from)) {
    elem.classList.remove(from);
    // void elem.offsetWidth;
    elem.classList.add(to);
  }
}

function getRandomArrayElement(arr) {
  if (!arr || !arr.length) return false;
  const index = Math.floor(Math.random() * arr.length);
  const value = arr[index];
  return value;
}

const callWrap = function (data, callback) {
  if (data) imagesInfo = data;
  if (callbackCalled) return;
  callbackCalled = true;
  callback();
};
