// const $ = document.querySelectorAll.bind(document);
const datetimeElem = document.getElementById("datetime");
const weatherElem = document.getElementById("weather");

const LOCATION_KEY = "[ftLocation]";
const WEATHER_KEY = "[ftWeather]";
const SETTINGS_KEY = "[ftSettings]";

const locationExpires = 24 * 3600 * 1000;
const weatherExpires = 24 * 3600 * 1000;

const geoURL =
  "http://api.ipstack.com/check?access_key=8d12001f101aa84677ecff474be34343";
const weatherURLTemplate =
  "https://api.openweathermap.org/data/2.5/weather?lat={LAT}&lon={LON}&appid=e0294aecfed3ca634a1a236d440e342a";
// const weatherIconTemplate = "https://openweathermap.org/img/w/{ICON}.png";

const currentTime = new Date().getTime();

if (datetimeElem) {
  const updateTime = function () {
    datetimeElem.innerHTML = new Date().toLocaleString();
  };
  setInterval(updateTime, 500);
  updateTime();
}

if (weatherElem) {
  getLocation().then(function (geoData) {
    getWeather(geoData).then(async function (weatherData) {
      let units = await getTempUnits();
      showWeather(geoData, weatherData, units);

      weatherElem.addEventListener("click", function () {
        units = units === "C" ? "F" : "C";
        setTempUnits(units);
        showWeather(geoData, weatherData, units);
      });
    });
  });
}

function getLocation() {
  return new Promise(async (resolve, reject) => {
    const data = await storage.get(LOCATION_KEY);
    if (data && data.savedAt + locationExpires > currentTime) {
      resolve(data);
    } else {
      try {
        let response = await request.get(geoURL);
        const location = await response.json();
        const lat = location.latitude;
        const lon = location.longitude;
        const city = location.city || location.location.capital;
        if (!lat || !lon || !city) {
          reject(new Error("Invalid result from geo service"));
        }
        const data = {
          lat: lat,
          lon: lon,
          city: city,
          savedAt: currentTime,
        };
        storage.set(LOCATION_KEY, data);
        resolve(data);
      } catch (e) {
        console.error(e);
        reject(e);
      }
    }
  });
}

function getWeather(geoData) {
  return new Promise(async (resolve, reject) => {
    const data = await storage.get(WEATHER_KEY);
    if (!(!data || data.savedAt + weatherExpires < currentTime)) {
      resolve(data);
    } else {
      if (!geoData || !geoData.lat || !geoData.lon) {
        return reject(new Error("Invalid geoData provided"));
      }
      const weatherURL = weatherURLTemplate
        .replace("{LAT}", encodeURIComponent(geoData.lat))
        .replace("{LON}", encodeURIComponent(geoData.lon));
      try {
        const response = await request.get(weatherURL);
        const result = await response.json();
        console.log("weather res: ", result);
        const temp = result.main.temp;
        const icon = result.weather[0].icon;
        if (!temp || !icon)
          throw new Error("Invalid result from weather service");
        const data = {
          temp: temp,
          icon: icon,
          savedAt: currentTime,
        };
        storage.set(WEATHER_KEY, data);
        resolve(data);
      } catch (e) {
        console.error(e);
        reject(false);
      }
    }
  });
}

async function getTempUnits() {
  const data = await storage.get(SETTINGS_KEY);
  let units = "C";
  if (data?.tempUnits) units = data.tempUnits;
  return units;
}

function setTempUnits(units) {
  storage.set(SETTINGS_KEY, { tempUnits: units });
}

function convertTempUnits(tempValue, units) {
  const unitsTypes = {
    C: (tempValue - 273.15).toFixed(1),
    F: ((tempValue * 9) / 5 - 459.67).toFixed(0),
  };
  return unitsTypes[units] ? unitsTypes[units] : tempValue;
}

async function showWeather(geoData, weatherData, tempUnits) {
  let html = "" + (geoData?.city || "");
  const weatherIcon = await getWeatherIcon(weatherData.icon);
  if (weatherData?.temp) {
    if (html) html += ": ";
    html += convertTempUnits(weatherData.temp, tempUnits) + " °" + tempUnits;
    if (weatherData?.icon)
      html += `<img src="${weatherIcon}" onerror="this.style.display=\'none\'">`;
  }
  weatherElem.innerHTML = html;
}

async function getWeatherIcon(iconName) {
  const stream = await request.get(
    `https://openweathermap.org/img/w/${iconName}.png`
  );
  const blob = await stream.blob();
  const url = window.URL.createObjectURL(blob);
  return url;
}
