class Storage {
  constructor() {
    this.chromeStorage = window?.chrome?.storage?.local;
  }
  get(id) {
    return new Promise((resolve, reject) => {
      if (this.chromeStorage) {
        this.chromeStorage.get(id, (data) => {
          resolve(data && data[id]);
        });
      } else {
        let data = null;
        try {
          data = JSON.parse(localStorage[id]);
        } catch (err) {
          reject(err);
        }
        resolve(data);
      }
    });
  }
  set(id, data) {
    if (this.chromeStorage) {
      const obj = {};
      obj[id] = data;
      this.chromeStorage.set(obj);
    } else {
      localStorage[id] = JSON.stringify(data);
    }
  }
}

class CustomRequest {
  async get(url) {
    return new Promise((resolve, reject) => {
      fetch(url, { method: "GET" })
        .then((response) => {
          resolve(response);
        })
        .catch((error) => {
          reject(error);
        });
    });
  }
}
