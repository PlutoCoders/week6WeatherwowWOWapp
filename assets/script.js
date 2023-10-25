dayjs.extend(window.dayjs_plugin_utc);
dayjs.extend(window.dayjs_plugin_timezone);

let browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

let timeZones = {
    americaNewYork: `America/New_York`,
    japanTokyo: `Asia/Tokyo`,
    taiwanTaipei: `Asia/Taipei`
}

let defaultTimeZone = browserTimezone || timeZones.americaNewYork;
let dateFormat = `MM/DD/YYYY`;
let timeFormat = `h:mm:ss a`;
let dayFormat = `dddd`;
let locationsDatabaseName = `locations`;
let fullDayFormat = `${dayFormat} ${dateFormat}`;
let fullDateFormat = `${timeFormat} ${dateFormat}`;
let locations = JSON.parse(localStorage.getItem(locationsDatabaseName)) || [];

const currentWeatherAPIKey = 'e77365f4013c7543eca0a224e6a01e78';
const oneCallWeatherAPIKey = 'ce5300e7acaa327ad655b8a21d5130d8';
const clearLocations = document.querySelector(`.clearLocations`);
const locationText = document.querySelector(`.locationValue`);
const conditionIcon = document.querySelector(`.conditionIcon`);
const dateText = document.querySelector(`.dateValue`);
const timeText = document.querySelector(`.timeValue`);
const temp = document.querySelector(`.tempValue`);
const wind = document.querySelector(`.windValue`);
const humidity = document.querySelector(`.humidityValue`);
const searchForm = document.querySelector(`.searchForm`);
const fivedayForcastElement = document.querySelector(`.fivedayForcast`);
const locationField = document.querySelector(`.locationField`);
const openWeatherAPIURL = `https://api.openweathermap.org/data/2.5`;
const locationButtonsElem = document.querySelector(`.locationButtons`);

const convertFromMSToMPH = (speedInMS, useDecimals = true) => {
    if (useDecimals == true) {
        return (speedInMS * 2.237).toFixed(2);
    } else {
        return Math.floor(speedInMS * 2.237);
    }
};

const convertFromKelvinToFahrenheit = (tempInKelvin, useDecimals = true) => {
    if (useDecimals == true) {
        return ((tempInKelvin - 273.15) * (9/5) + 32).toFixed(2);
    } else {
        return Math.floor((tempInKelvin - 273.15) * (9/5) + 32);
    }
};

const refreshWeatherData = (weatherData) => {
    conditionIcon.innerHTML = `<img src="http://openweathermap.org/img/wn/${weatherData?.weather[0]?.icon}@2x.png" alt="Weather Condition" />`;
    locationText.innerHTML = `${weatherData?.name}, ${weatherData?.sys.country}`;
    temp.innerHTML = convertFromKelvinToFahrenheit(weatherData.main.temp);
    wind.innerHTML = convertFromMSToMPH(weatherData.wind.speed);
    humidity.innerHTML = weatherData.main.humidity;
}

const storeLocationFromData = (weatherDataWithForecast) => {
    // Destruct obj and retrieve data
    let { lat, lon, name, timezone } = weatherDataWithForecast;

    // Creating object to store
    let locationToStore = { 
        name, 
        timezone,
        coordinates: {
            latitude: lat,
            longitude: lon
        }
    }

    let locationNames = locations.map(loc => loc.name);

    // Check if location already exists
    if (locationNames.includes(locationToStore.name)) {
        return;
    } else {
        locations.push(locationToStore);
    }

    localStorage.setItem(locationsDatabaseName, JSON.stringify(locations));

    refreshLocations();
}

const set5DayForcastData = (weatherDataWithForecast) => {
    // date
    dateText.innerHTML = dayjs().tz(weatherDataWithForecast.timezone).format(dateFormat);
    // time
    timeText.innerHTML = dayjs().tz(weatherDataWithForecast.timezone).format(timeFormat);

    let { daily } = weatherDataWithForecast;
    let fiveDay = daily.map((day, dayIndex) => { 
        let thisDay =  dayjs().add(dayIndex, `days`).tz(weatherDataWithForecast.timezone);
        return {
            ...day, 
            daysFullFormat: thisDay.format(fullDayFormat),
            dt: thisDay.format(fullDateFormat),
            daysDate: thisDay.format(dateFormat),
            daysTime: thisDay.format(timeFormat),
            dayDay: thisDay.format(dayFormat),
        }
     }).slice(1, 6);

     fivedayForcastElement.innerHTML = ``;

    // Making the caster
    fiveDay.forEach((day, dayIndex) => {
        let dayForecastElement = document.createElement(`div`);
        dayForecastElement.className = `dayCast weatherData`;

        let daysHumidity = day.humidity;
        let daysFullFormat = day.daysFullFormat;
        let daysWeatherIcon = day.weather[0].icon;
        let daysWindSpeed = convertFromMSToMPH(day.wind_speed, false);
        let daysTemperatureInF = convertFromKelvinToFahrenheit(day.temp.max);

        let daysLocationElement = document.createElement(`div`);
        daysLocationElement.className = `location`;
        let daysWeatherDetailsElement = document.createElement(`div`);
        daysWeatherDetailsElement.className = `locationWeatherDetails`;

        let daysLocationValue = document.createElement(`span`);
        daysLocationValue.className = `locationValue`;
        let daysConditionIcon = document.createElement(`span`);
        daysConditionIcon.className = `conditionIcon`;

        daysLocationValue.innerHTML = daysFullFormat;
        daysConditionIcon.innerHTML = `<img src="http://openweathermap.org/img/wn/${daysWeatherIcon}@2x.png" alt="Weather Condition" />`;

        let tempField = document.createElement(`div`);
        let windField = document.createElement(`div`);
        let humidityField = document.createElement(`div`);

        tempField.className = `temp`;
        tempField.innerHTML = `Temp: <span class="tempValue">${daysTemperatureInF}</span> F`;

        windField.className = `wind`;
        windField.innerHTML = `Wind: <span class="windValue">${daysWindSpeed}</span> M/H`;

        humidityField.className = `humidity`;
        humidityField.innerHTML = `Humidity: <span class="humidityValue">${daysHumidity}</span> %`;

        daysWeatherDetailsElement.append(tempField);
        daysWeatherDetailsElement.append(windField);
        daysWeatherDetailsElement.append(humidityField);

        daysLocationElement.append(daysLocationValue);
        daysLocationElement.append(daysConditionIcon);

        dayForecastElement.append(daysLocationElement);
        dayForecastElement.append(daysWeatherDetailsElement);
        
        fivedayForcastElement.append(dayForecastElement);
    });

    weatherDataWithForecast = {
        ...weatherDataWithForecast,
        fiveDay,
        testObject: {
            id: 1,
            reason: `test`,
        }
    }

    storeLocationFromData(weatherDataWithForecast);
}

const fetchWeatherData5DayForecast = async (coordinates, name) => {
    let { latitude, longitude } = coordinates;
    try {
        let weatherDataForecastResponse = await fetch(`${openWeatherAPIURL}/onecall?lat=${latitude}&lon=${longitude}&appid=${oneCallWeatherAPIKey}`);
        if (weatherDataForecastResponse.ok == true) {
            let forecastData = await weatherDataForecastResponse.json(); 
            if (forecastData != undefined) {
                forecastData = {
                    ...forecastData,
                    name
                }
                set5DayForcastData(forecastData);
            }
        } else {
            console.log(`error fetching five day data`, weatherDataForecastResponse);
        }
    } catch (error) {
        console.log(`error fetching five day data`, error);
    }
}

const fetchWeatherData = async (city) => {
    try {
        let weatherDataResponse = await fetch(`${openWeatherAPIURL}/weather?q=${city}&appid=${currentWeatherAPIKey}`);
        if (weatherDataResponse.ok == true) {
            let weatherData = await weatherDataResponse.json(); 
            if (weatherData != undefined) {
                let coordinates = { latitude: weatherData.coord.lat, longitude: weatherData.coord.lon };
                let weatherName = weatherData.name;
                fetchWeatherData5DayForecast(coordinates, weatherName);
                refreshWeatherData(weatherData);
            }
        } else {
            console.log(`error fetching data`, weatherDataResponse);
        }
    } catch (error) {
        console.log(error);
    }
}

clearLocations.addEventListener(`click`, event => {
    localStorage.clear();
    window.location.reload();
})

searchForm.addEventListener(`submit`, formSubmitEvent => {
    formSubmitEvent.preventDefault();
    if (locationField.value != ``) {
        if (locationField.value.length > 3) {
            fetchWeatherData(locationField.value);
            searchForm.reset();
        } else {
            console.log(`Please type valid city`);
        }
    }    
});

const refreshLocations = () => {
    if (locations.length > 0) {
        clearLocations.style.display = `block`;
        locationButtonsElem.innerHTML = ``;
        locations.forEach((location, locationIndex) => {
            let locationButton = document.createElement(`button`);
            locationButton.className = `locationButton btn btn-dark`;
            locationButton.innerHTML = location.name;
            locationButtonsElem.append(locationButton);
        });
    
        let locationButtons = document.querySelectorAll(`.locationButton`);
        
        locationButtons.forEach(locButton => {
            locButton.addEventListener(`click`, event => {
                let locationWeClickedOn = event.target.innerHTML;
                fetchWeatherData(locationWeClickedOn);
            })
        })
    } else {
        clearLocations.style.display = `none`;
    }
}

const initialize = () => {
    refreshLocations();
}

initialize();