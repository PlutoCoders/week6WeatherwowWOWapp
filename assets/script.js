// Config
// Date Timezone Formatting
dayjs.extend(window.dayjs_plugin_utc);
dayjs.extend(window.dayjs_plugin_timezone);

let timezones = {
    america_US_NewYork: `America/New_York`,
    asia_Taiwan_Taipei: `Asia/Taipei`,
    asia_Japan_Tokyo: `Asia/Tokyo`,
}

let browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
let defaultTimezone = timezones.asia_Taiwan_Taipei || browserTimezone;

console.log(`Date Time in ${defaultTimezone}`, dayjs().tz(defaultTimezone).format(`hh:mm:ss A dddd MM/DD/YYYY`));

const copyrightYear = document.querySelector(`.year`);
const copyrightYearValue = dayjs().format(`YYYY`);
copyrightYear.innerHTML = copyrightYearValue;

// Weather Logic
const temp = document.querySelector(`.tempValue`);
const wind = document.querySelector(`.windValue`);
const dateText = document.querySelector(`.dateText`);
const humidity = document.querySelector(`.humidityValue`);
const locationText = document.querySelector(`.locationText`);
const openWeatherAPIKey = `ce5300e7acaa327ad655b8a21d5130d8`;
const locationField = document.querySelector(`.locationField`);
const locationSearchForm = document.querySelector(`.locationSearchForm`);
const convertFromMSToMPH = (speedInMS) => (speedInMS * 2.237).toFixed(2);
const convertFromKelvinToFahrenheit = (tempInKelvin) => ((tempInKelvin - 273.15) * (9/5) + 32).toFixed(2);

const refreshWeatherData = (weatherData) => {
    console.log(`Raw JSON Data from Open Weather`, weatherData);
    locationText.innerHTML = `${weatherData.name}, ${weatherData.sys.country}`;
    dateText.innerHTML = dayjs().format(`MM/DD/YYYY`);
    temp.innerHTML = convertFromKelvinToFahrenheit(weatherData.main.temp);
    wind.innerHTML = convertFromMSToMPH(weatherData.wind.speed);
    humidity.innerHTML = weatherData.main.humidity;
}

// Native way to fetch data in javascript
// Fetch API
// Fetch with a URL, then we use a .then to check the response, if the response is ok, we use a final .then to parse the data
const fetchWeatherData = (city) => {
    fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${openWeatherAPIKey}`).then(response => {
        if (response.ok) {
            // When we view data, it makes sense to convert to JSON
            // JSON stands for JavaScript Object Notation
            // JSON is just objects and arrays
            return response.json();
        } else {
            // Gracefully handle the error here
            console.log(`Error fetching data`, response);
            alert(`Error fetching data, City ${response.statusText}`);
            return;
        }
    }).then(weatherDataFromAPI => {
        if (weatherDataFromAPI != undefined) {
            refreshWeatherData(weatherDataFromAPI);
        }
    });
}

// Default behavior of a form is to refresh the page
locationSearchForm.addEventListener(`submit`, weatherDataFormEvent => {
    weatherDataFormEvent.preventDefault();
    // Do logic for weather
    // Make sure the user has valid input
    // Make sure the user typed in more than 2 characters
    // Get the value
    let value = locationField.value;
    if (value != ``) {
        if (value.length < 3) {
            console.log(`Please Type Valid City`);
        } else {
           fetchWeatherData(value); 
        }
    }
});