// This is the first version of Physicify that will be used in the first phase study
import React from "react";
import {
  TextInput,
  Text,
  View,
  Image,
  TouchableOpacity,
  KeyboardAvoidingView,
  Alert,
  LayoutAnimation,
} from "react-native";

import { loginStyles } from "./Styles";
import { getDataModel } from "./DataModel";
import moment, { min } from "moment";
import * as Location from "expo-location";

const WEATHER_API_KEY = "38e37d6792982c51e50d914fd160ae89";

export class LoginScreen extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      displayNameInput: "",
      passwordInput: "",
      imageURI: "http://openweathermap.org/img/w/unknown.png",
    };
  }
  componentDidMount = async () => {
    this.dataModel = getDataModel();
    await this.dataModel.asyncInit();
    this.focusUnsubscribe = this.props.navigation.addListener(
      "focus",
      this.onFocus
    );
    //
  };
  onFocus = async () => {
    console.log("on Focus");
    await this.dataModel.asyncInit();
    this.dataModel = getDataModel();
  };

  fetchWeatherInfo = async (userPlans) => {
    let location = await this.getLocation();
    let latitude = location.coords.latitude;
    let longitude = location.coords.longitude;
    let today = new Date();
    //console.log("userPlans",userPlans);
    let backDate = new Date();
    let historyDateList = [];

    let thisMonthWeather = [];
    let nextMonthWeather = [];
    let lastMonthWeather = [];

    let fullHistoryWeatherList = [];

    for (let i = 28; i > 0; i--) {
      let yesterday = new Date(backDate);
      yesterday.setDate(yesterday.getDate() - 1);
      backDate = yesterday;
      historyDateList.push(yesterday);
    }
    for (let date of historyDateList) {
      date.setHours(date.getHours() - 5);
      let ifPlanExist = false;
      for (let event of userPlans) {
        if (event.start) {
          let planDate = new Date(event.start);
          if (
            date.getMonth() === planDate.getMonth() &&
            date.getDate() === planDate.getDate()
          ) {
            ifPlanExist = true;
            planDate.setHours(planDate.getHours() - 5);
            date = planDate;
          }
        }
      }
      let isoPlanDate = moment(date).unix();
      let weatherHistoryURL = `http://history.openweathermap.org/data/2.5/history/city?lat=${latitude}&lon=${longitude}&type=hour&start=${isoPlanDate}&cnt=1&appid=${WEATHER_API_KEY}`;
      let weatherHistoryResponse = await fetch(weatherHistoryURL);
      let weatherHistoryJSON = await weatherHistoryResponse.json();
      let historicalWeatherItem = Object.assign(
        {},
        weatherHistoryJSON.list[0].weather[0]
      );
      historicalWeatherItem.date = new Date(
        weatherHistoryJSON.list[0].dt * 1000
      );
      historicalWeatherItem.temp = parseInt(
        weatherHistoryJSON.list[0].main.temp - 273
      );
      fullHistoryWeatherList.push(historicalWeatherItem);
    }
    //console.log(fullHistoryWeatherList);

    for (let weather of fullHistoryWeatherList) {
      let weatherImgList = {
        date: weather.date.getDate(),
        img: weather.icon,
        temp: weather.temp,
      };
      if (weather.date.getMonth() === today.getMonth()) {
        if (weather.date.getDate() != today.getDate()) {
          thisMonthWeather.push(weatherImgList);
        }
      } else {
        lastMonthWeather.push(weatherImgList);
      }
    }

    let weatherURL = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${WEATHER_API_KEY}`;
    let currWeatherResponse = await fetch(weatherURL);
    let weatherJson = await currWeatherResponse.json();
    let weatherNow = {
      date: today.getDate(),
      img: weatherJson.weather[0].icon,
      temp: weatherJson.main.feels_like,
    };
    thisMonthWeather.push(weatherNow);
    let imageURI =
      "http://openweathermap.org/img/w/" + weatherJson.weather[0].icon + ".png";
    this.setState({ imageURI: imageURI });

    let weatherForecastList = [];
    let weatherForecastURL = `http://api.openweathermap.org/data/2.5/forecast/daily?lat=${latitude}&lon=${longitude}&cnt=${16}&units=metric&appid=${WEATHER_API_KEY}`;
    let weatherForecastResponse = await fetch(weatherForecastURL);
    let weatherForecastJSON = await weatherForecastResponse.json();
    for (let weather of weatherForecastJSON.list) {
      let newWeatherForecast = Object.assign({}, weather.weather[0]);
      newWeatherForecast.date = new Date(weather.dt * 1000);
      newWeatherForecast.temp = weather.feels_like.day;
      weatherForecastList.push(newWeatherForecast);
    }
    // console.log("weatherForecastList",weatherForecastList);

    for (let weather of weatherForecastList) {
      let weatherImgList = {
        date: weather.date.getDate(),
        img: weather.icon,
        temp: weather.temp,
      };
      if (weather.date.getMonth() === today.getMonth()) {
        if (weather.date.getDate() != today.getDate()) {
          thisMonthWeather.push(weatherImgList);
        }
      } else {
        nextMonthWeather.push(weatherImgList);
      }
    }
    //console.log("lastMonthWeather",lastMonthWeather);
    //console.log("thisMonthWeather",thisMonthWeather);
    //console.log("nextMonthWeather",nextMonthWeather);
    return [lastMonthWeather, thisMonthWeather, nextMonthWeather];
  };

  getLocation = async () => {
    let { status } = await Location.requestPermissionsAsync();
    if (status !== "granted") {
      console.log("Permission Denied");
      return;
    }
    let location = await Location.getCurrentPositionAsync({});
    return location;
  };
  getStartEndDate = () => {
    let today = new Date();
    let startDate = new Date(2021, today.getMonth(), 1);
    let isoStartDate = moment(startDate).unix();
    let endDate = new Date(2021, today.getMonth() + 1, 0);
    let isoEndDate = moment(endDate).unix();

    console.log("isoStartDate", isoStartDate);
    console.log("isoEndDate", isoEndDate);
  };
  onGoogleSignIn = async () => {
    console.log("Google Sign In");
    let userList = this.dataModel.getUsers();
    let [timeMin, timeMax] = this.processDate();
    //console.log(timeMin, timeMax);
    let [calEvents, calendarsID] = await this.dataModel.googleServiceInit(
      timeMin,
      timeMax
    );
    //console.log("calEvents",calEvents);
    let [previousMonthList, thisMonthList, nextMonthList, fullEventList] =
      this.processCalEvent(calEvents.items);
    let key;
    let isUserFound = false;
    console.log("calendarsID", calendarsID);
    for (let user of userList) {
      if (calendarsID === user.email) {
        //console.log("user.email", user.email);
        isUserFound = true;
        key = user.key;
      }
    }
    if (!isUserFound) {
      await this.dataModel.createNewUser(calendarsID);
      key = this.dataModel.getUserKey();
      await this.dataModel.createDailyNotifications();
      
    }
    
    // console.log(previousMonthList);
    // console.log(thisMonthList);
    // console.log(nextMonthList);
    let userDefineActivitiesNotExist =
      await this.dataModel.isUserDefineActivitiesExist(key);
    if (userDefineActivitiesNotExist) {
      await this.dataModel.createUserActivities(key);
    }
    let userActivityList = await this.dataModel.getUserActivities(key);
    //console.log("userActivityList",userActivityList);
    // console.log("user key:",key);
    await this.dataModel.loadUserPlans(key);
    let userPlans = this.dataModel.getUserPlans();

    let userInfo = {
      key: key,
      userPlans: userPlans,
    };
    //console.log("userInfo",userInfo);
    // console.log("userPlans",userPlans);
    // let [
    //   lastMonthWeather,
    //   thisMonthWeather,
    //   nextMonthWeather,
    // ] = await this.fetchWeatherInfo(userPlans);

    // console.log("lastMonthWeather", lastMonthWeather);
    // console.log("thisMonthWeather", thisMonthWeather);

    // console.log("nextMonthWeather", nextMonthWeather);
    //console.log("userActivityList",userActivityList);
    //console.log("userActivityList.activityList",userActivityList.activityList);
    this.props.navigation.navigate("Home Screen", {
      userEmail: calendarsID,
      userInfo: userInfo,
      eventsLastMonth: previousMonthList,
      eventsThisMonth: thisMonthList,
      eventsNextMonth: nextMonthList,
      fullEventList: fullEventList,
      userActivityList: userActivityList[0].activityList,
      // lastMonthWeather: lastMonthWeather,
      // thisMonthWeather: thisMonthWeather,
      // nextMonthWeather: nextMonthWeather,
    });
  };

  processDate = () => {
    let currDate = new Date();
    let month = currDate.getMonth();
    let year = currDate.getFullYear();
    let monthMin = month;
    let monthMax = month + 2;
    if (monthMin < 10) {
      monthMin = "0" + monthMin;
    }
    if (monthMax < 10) {
      monthMax = "0" + monthMax;
    }
    let dateMin = "timeMin=" + year + "-" + monthMin + "-01T10%3A00%3A00Z";
    let monthDays = moment(year + "-" + monthMax, "YYYY-MM").daysInMonth();
    let dateMax =
      "timeMax=" + year + "-" + monthMax + "-" + monthDays + "T23%3A00%3A00Z";
    console.log("dateMin, dateMax", dateMin, dateMax);
    return [dateMin, dateMax];
  };

  processCalEvent = (eventList) => {
    let currMonth = moment().format("YYYY-MM");
    let nextMonth = moment().add(1, "months").format("YYYY-MM");

    let lastMonth = moment().subtract(1, "months").format("YYYY-MM");
    //console.log(nextMonth,lastMonth);
    let previousMonthList = [];
    let thisMonthList = [];
    let nextMonthList = [];

    let fullEventList = [];

    for (let dayEvent of eventList) {
      //console.log("dayEvent.start ",dayEvent.start);
      let timeStamp;
      if (dayEvent.start) {
        if (dayEvent.start.dateTime) {
          timeStamp = dayEvent.start.dateTime.slice(0, 7);
        } else {
          timeStamp = dayEvent.start.date.slice(0, 7);
        }
        //console.log("typeof(dayEvent.start.dateTime)",typeof(dayEvent.start.dateTime));
        let simplifiedEvent = {
          start: dayEvent.start.dateTime,
          end: dayEvent.end.dateTime,
        };
        fullEventList.push(simplifiedEvent);
        if (timeStamp === currMonth) {
          thisMonthList.push(simplifiedEvent);
        } else if (timeStamp === nextMonth) {
          //console.log(timeStamp, "next month added");
          nextMonthList.push(simplifiedEvent);
        } else if (timeStamp === lastMonth) {
          //console.log(timeStamp, "last month added");
          previousMonthList.push(simplifiedEvent);
        }
      }
    }
    return [previousMonthList, thisMonthList, nextMonthList, fullEventList];
    //console.log(currMonth);
  };

  // onRegist = () => {
  //   //console.log("Regist");
  //   this.props.navigation.navigate("SignUp", {});
  // };
  render() {
    return (
      <View
        style={loginStyles.inputContatiner}
        behavior={"height"}
        keyboardVerticalOffset={1}
      >
        {/* <View style={loginStyles.inputField}>
          <Text style={loginStyles.inputFont}>Email</Text>
          <View style={loginStyles.inputText}>
            <TextInput
              style={loginStyles.inputTextField}
              autoCapitalize="none"
              autoCorrect={false}
              value={this.state.displayNameInput}
              onChangeText={(text) => {
                this.setState({ displayNameInput: text });
              }}
            />
          </View>
          <Text style={loginStyles.inputFont}>Password</Text>
          <View style={loginStyles.inputText}>
            <TextInput
              secureTextEntry={true}
              style={loginStyles.inputTextField}
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="password"
              value={this.state.passwordInput}
              onChangeText={(text) => {
                this.setState({ passwordInput: text });
              }}
            />
          </View>
        </View> */}
        <View style={loginStyles.buttonArea}>
          {/* <TouchableOpacity
            style={loginStyles.buttonStyle}
            onPress={() => this.onLogin()}
          >
            <Text style={loginStyles.buttonFont}>Log in</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={loginStyles.buttonStyle}
            onPress={() => this.onRegist()}
          >
            <Text style={loginStyles.buttonFont}>Sign up</Text>
          </TouchableOpacity> */}
          <TouchableOpacity
            style={loginStyles.buttonStyle}
            onPress={() => this.onGoogleSignIn()}
          >
            <Text style={loginStyles.buttonFont}>Sign In with Google</Text>
          </TouchableOpacity>

          {/* <TouchableOpacity
            style={loginStyles.buttonStyle}
            onPress={async () => {
              Alert.alert(
                "Please select an activity",
                "Activity Type Missing",
                [{ text: "OK", onPress: () => console.log("OK Pressed") }]
              );
            }}
          >
            <Text style={loginStyles.buttonFont}>test</Text>
          </TouchableOpacity> */}
          {/* <TouchableOpacity
            style={loginStyles.buttonStyle}
            onPress={() => this.fetchWeatherInfo()}
          >
            <Text style={loginStyles.buttonFont}>Fetch weather</Text>
          </TouchableOpacity>
          <View>
            <Image
              source={{ uri: this.state.imageURI }}
              style={{ width: 100, height: 100 }}
            />
          </View>
          <TouchableOpacity
            style={loginStyles.buttonStyle}
            onPress={() => this.getStartEndDate()}
          >
            <Text style={loginStyles.buttonFont}>Test date</Text>
          </TouchableOpacity> */}
        </View>
      </View>
    );
  }
}
