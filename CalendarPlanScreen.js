import React, { useState } from "react";
import {
  TextInput,
  Text,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  KeyboardAvoidingView,
  Alert,
  Modal,
  LayoutAnimation,
  SectionList,
  Button,
  Animated,
} from "react-native";

import { getDataModel } from "./DataModel";
import { MonthCalendar } from "./Calendar";
import * as Google from "expo-google-app-auth";
import { Calendar } from "react-native-big-calendar";
import SegmentedControl from "@react-native-segmented-control/segmented-control";
import DropDownPicker from "react-native-dropdown-picker";

import SlidingUpPanel from "rn-sliding-up-panel";
import DateTimePicker from "@react-native-community/datetimepicker";
import moment, { min } from "moment";

import { Ionicons } from "@expo/vector-icons";
import { AntDesign } from "@expo/vector-icons";
import { MaterialIcons } from "@expo/vector-icons";
import SwitchSelector from "react-native-switch-selector";

import ModalSelector from "react-native-modal-selector";
import { FlatList } from "react-native-gesture-handler";

const WEEKDAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export class CalendarPlanScreen extends React.Component {
  constructor(props) {
    super(props);
    this.months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    this.activityData = [
      { key: 1, section: true, label: "Physical Activities" },
    ];
    let activityList = this.props.route.params.userActivityList;
    console.log("activityList", activityList);
    this.index = 1;
    for (let activity of activityList) {
      this.index++;
      let activityObj = {
        key: this.index,
        label: activity,
      };
      this.activityData.push(activityObj);
    }

    this.monthCalRef = React.createRef();
    this.weekCalRef = React.createRef();
    this.dataModel = getDataModel();
    this.userEmail = this.props.route.params.userEmail;
    this.eventsLastMonth = this.props.route.params.eventsLastMonth;
    this.eventsThisMonth = this.props.route.params.eventsThisMonth;
    this.eventsNextMonth = this.props.route.params.eventsNextMonth;

    this.fullEventList = this.props.route.params.fullEventList;

    this.selectedActivity;
    this.isActivitySelected = false;
    //console.log(this.eventsThisMonth);

    this.eventToday = {
      title: "default",
      start: "default",
    };

    this.userKey = this.props.route.params.userInfo.key;
    this.userPlans = this.props.route.params.userInfo.userPlans;
    this.isReportModalVis = false;

    this.combinedEventListThis = this.eventsThisMonth;
    this.combinedEventListLast = this.eventsLastMonth;
    this.combinedEventListNext = this.eventsNextMonth;
    this.combineEventListFull = this.fullEventList;

    this.pastPlans = [];
    this.futurePlans = [];
    this.planToday = [];

    let todayDate = new Date();
    for (let event of this.userPlans) {
      if (event.title && !event.isDeleted) {
        let eventDate = new Date(event.start);
        if (!event.isReported) {
          if (
            eventDate.getMonth() === todayDate.getMonth() &&
            eventDate.getDate() === todayDate.getDate()
          ) {
            if (
              !this.planToday.includes(event) &&
              !this.planToday.some((e) => e.timeStamp === event.timeStamp)
            ) {
              this.planToday.push(event);
            }
          } else {
            if (todayDate >= eventDate) {
              if (
                !this.pastPlans.includes(event) &&
                !this.pastPlans.some((e) => e.timeStamp === event.timeStamp)
              ) {
                this.pastPlans.push(event);
              }
            } else {
              if (
                !this.futurePlans.includes(event) &&
                !this.futurePlans.some((e) => e.timeStamp === event.timeStamp)
              ) {
                this.futurePlans.push(event);
              }
            }
          }
        }
      }
    }
    //console.log("planToday",planToday);
    this.pastPlans.sort((a, b) => {
      return new Date(a.start) - new Date(b.start);
    });
    this.futurePlans.sort((a, b) => {
      return new Date(a.start) - new Date(b.start);
    });

    // console.log("pastPlans", pastPlans);
    // console.log("futurePlans", futurePlans);

    // this.lastMonthWeather = this.props.route.params.lastMonthWeather;
    // this.thisMonthWeather = this.props.route.params.thisMonthWeather;
    // this.nextMonthWeather = this.props.route.params.nextMonthWeather;

    for (let event of this.userPlans) {
      if (event.title && !event.isDeleted) {
        if (
          !this.combineEventListFull.includes(event) &&
          !this.combineEventListFull.some(
            (e) => e.timeStamp === event.timeStamp
          )
        ) {
          this.combineEventListFull.push(event);
        }

        let monthNum = parseInt(event.end.slice(5, 7));
        let currMonth = new Date();
        if (monthNum === currMonth.getMonth() + 1) {
          if (
            !this.combinedEventListThis.includes(event) &&
            !this.combinedEventListThis.some(
              (e) => e.timeStamp === event.timeStamp
            )
          ) {
            this.combinedEventListThis.push(event);
          }
        } else if (monthNum === currMonth.getMonth()) {
          if (
            !this.combinedEventListLast.includes(event) &&
            !this.combinedEventListLast.some(
              (e) => e.timeStamp === event.timeStamp
            )
          ) {
            this.combinedEventListLast.push(event);
          }
        } else {
          if (
            !this.combinedEventListNext.includes(event) &&
            !this.combinedEventListNext.some(
              (e) => e.timeStamp === event.timeStamp
            )
          ) {
            this.combinedEventListNext.push(event);
          }
        }
        //let plannedEvent = Object.assign({}, event);
      }
    }
    this.isNoEventDayReportModalVis = false;
    this.isPlannedToday = false;
    this.isPlannedDate = new Date();
    this.isDailyReportBtnDisabled = true;
    this.btnName = "Next";
    this.nextBtnState = "next";
    this.reportPopUp(this.userPlans);
    this.state = {
      isMonthCalVis: true,
      date: new Date(),
      panelTop: "Pick a date to plan",
      selectedDate: "",
      selectedMonth: "",
      isPlanBtnDisable: true,
      eventsLastMonth: this.combinedEventListLast,
      eventsThisMonth: this.combinedEventListThis,
      eventsNextMonth: this.combinedEventListNext,
      fullEventList: this.combineEventListFull,
      isFromWeekView: false,
      indexView: "Month",
      newListByActivity: [],
      isReportModalVis: this.isReportModalVis,
      isDayReportModalVis: false,
      //Update Report Modal
      isActivityCompleted: false,
      isOtherActivity: false,

      isFirstStepVis: "flex",
      isSecondYesStepVis: "none",
      isThirdYesStepVis: "none",

      isSecondNoStepVis: "none",
      isThirdNoStepVis: "none",
      isBackBtnVis: true,

      //datePickerDate: new Date(),
      timePickerDate: new Date(),

      //Update Report Modal Button
      isButtonFirstStage: true,
      btnName: this.btnName,
      nextBtnState: this.nextBtnState,
      submitBtnState: true,
      reason: "",
      feeling: "Neutral",

      otherActivity: "",

      monthCalCurrDate: new Date(),
      isMonthPreBtnAble: true,
      isMonthNextBtnAble: true,
      monthCalCurrentMonth: new Date().getMonth(),

      weatherThisMonth: this.thisMonthWeather,

      isEventDetailModalVis: false,

      detailViewTemp: "",
      detailViewIcon: "",

      detailViewTop: "",

      slideUpDayNum: "",
      isPlannedEventModalVis: false,
      isWeatherVisOnPanel: "none",

      eventFilteredList: false,
      timeFilteredList: false,

      activityPickerInitVal: "none",

      detailViewCalendar: [],

      pastPlans: this.pastPlans,
      futurePlans: this.futurePlans,
      todayPlan: this.planToday,

      activityData: this.activityData,
      userDefinedActivityText: "",

      isNoEventDayReportModalVis: this.isNoEventDayReportModalVis,
      isPlannedToday: this.isPlannedToday,
      isPlannedDate: this.isPlannedDate,

      isDailyReportBtnDisabled: this.isDailyReportBtnDisabled,

      secSwitchSelectorInitVal: 0,
    };
    //console.log("weatherThisMonth",this.state.weatherThisMonth);
    // this.monthCalRef = React.createRef();
  }

  // onNext = () => {
  //   console.log("Next");
  // };

  // /* define the method to be called when you go on back step */

  // onBack = () => {
  //   console.log("Back");
  // };

  // /* define the method to be called when the wizard is finished */

  // finish = (finalState) => {
  //   console.log(finalState);
  // };
  // getEventToday = () => {
  //   let userPlanList = this.userPlanList;
  //   let eventToday;
  //   let currentDate = moment(new Date()).format().slice(0, 10);
  //   for (let event of userPlanList) {
  //     if (event.end) {
  //       let eventDate = event.end.slice(0, 10);
  //       if (currentDate === eventDate) {
  //         console.log(event);
  //       }
  //     }
  //   }
  //   // return eventToday;
  // };

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
    this.dataModel = getDataModel();
    await this.dataModel.asyncInit();

    await this.dataModel.loadUserPlans(this.userKey);
    this.userPlans = this.dataModel.getUserPlans();
    
    this.reportPopUp(this.userPlans);
    if (this.isNoEventDayReportModalVis) {
      this.setState({isNoEventDayReportModalVis: true});
      this.setState({ btnName: "Submit"});
      this.setState({ nextBtnState: "submit"});

    }
  };

  reportPopUp = (userPlanList) => {
    let currentDate = moment(new Date()).format().slice(0, 10);
    //console.log("userPlanList", userPlanList);
    let isNoEventToday = true;
    for (let event of userPlanList) {
      if (event.end && !event.isDeleted) {
        let eventDate = event.end.slice(0, 10);
        //console.log("eventDate", eventDate);
        if (eventDate === currentDate) {
          
          isNoEventToday = false;
          console.log("isNoEventToday", isNoEventToday);
        }
        //let eventDate = event.end.slice(0, 10);
        //console.log(eventDate);
        if (currentDate === eventDate) {
          if (event.isReported === false && event.title) {
            this.isReportModalVis = true;
            this.eventToday = event;
          }
        }
        if (event.title) {
          if (event.timeStamp.slice(0, 10) === currentDate) {
            this.isPlannedToday = true;
            this.isPlannedDate = event.start.slice(0, 10);
          }
        }
        //console.log(this.isPlannedToday);
      }
    }
    console.log("isNoEventToday", isNoEventToday);
    
    if (isNoEventToday) {
      this.isNoEventDayReportModalVis = true;
      this.isDailyReportBtnDisabled = false;
      this.btnName = "Submit";
      this.nextBtnState = "submit";
    } else {
      this.isNoEventDayReportModalVis = false;
    }
    //console.log("this.isReportModalVis", this.isReportModalVis);
  };
  onPress = (item, monthNum, month) => {
    console.log("item,monthNum,month", item, monthNum, month);
    //console.log("this.userPlans", this.userPlans);
    let isPlanAble = false;
    let isPlanOnThatDay = false;
    //this.reportPopUp(this.userPlans);
    let planDetailList = [];
    for (let plan of this.userPlans) {
      if (plan.end) {
        let plannedMonth = parseInt(plan.end.slice(5, 7));
        let plannedDate = parseInt(plan.end.slice(8, 10));
        if (monthNum + 1 == plannedMonth && item == plannedDate) {
          isPlanOnThatDay = true;
          let planDetail = plan;
          if (
            !planDetailList.includes(planDetail) &&
            !planDetailList.some((e) => e.timeStamp === planDetail.timeStamp)
          ) {
            planDetailList.push(planDetail);
          }
        }
      }
    }
    //console.log("planDetailList[0]",planDetailList[0]);
    //console.log("planDetailList", planDetailList);
    if (monthNum === this.state.date.getMonth()) {
      if (item > this.state.date.getDate()) {
        if (planDetailList.length === 0) {
          isPlanAble = true;
        } else {
          if (planDetailList[0].isDeleted) {
            isPlanAble = true;
            for (let event of planDetailList) {
              if (event.isDeleted === false) {
                isPlanAble = false;
              }
            }
          }
        }
      }
    } else if (monthNum > this.state.date.getMonth()) {
      if (planDetailList.length === 0) {
        isPlanAble = true;
      } else {
        if (planDetailList[0].isDeleted) {
          isPlanAble = true;
        }
      }
    }
    if (isPlanAble) {
      this.setState({ panelTop: "plan for " + month + " " + item });
      this._panel.show();

      let targetDate = new Date(this.state.date.getFullYear(), monthNum, item);
      this.setState({ slideUpDayNum: WEEKDAY[targetDate.getDay()] });
      let slideUpWeatherList = [];
      if (monthNum === this.state.date.getMonth()) {
        slideUpWeatherList = this.thisMonthWeather;
      } else {
        slideUpWeatherList = this.nextMonthWeather;
      }
      for (let weather of slideUpWeatherList) {
        if (weather.date === item) {
          this.setState({ detailViewTemp: weather.temp });
          this.setState({ detailViewIcon: weather.img });
        }
      }
      //console.log(targetDate);
      this.setState({ isFromWeekView: false });
      this.setState({ selectedDate: item });
      this.setState({ selectedMonth: monthNum });
      this.setState({ isPlanBtnDisable: false });
      this.setState({ isWeatherVisOnPanel: "flex" });
    } else {
      if (!planDetailList[0].isDeleted && planDetailList.length === 1) {
        this.eventToday = planDetailList[0];
        console.log("this.eventToday", this.eventToday);
        let detailViewCalendar = [];
        for (let event of this.state.eventsThisMonth) {
          if (event.start.slice(0, 10) === this.eventToday.start.slice(0, 10)) {
            detailViewCalendar.push(event);
          }
        }
        this.setState({ detailViewCalendar: detailViewCalendar });
        console.log("detailViewCalendar", detailViewCalendar);
        let currMonthNum = parseInt(this.eventToday.end.slice(5, 7));
        let currDate = parseInt(this.eventToday.end.slice(8, 10));
        // let weatherList = [];
        // if (currMonthNum === this.state.date.getMonth() + 1) {
        //   weatherList = this.thisMonthWeather;
        // } else {
        //   weatherList = this.lastMonthWeather;
        // }
        // for (let weather of weatherList) {
        //   if (weather.date === currDate) {
        //     this.setState({ detailViewTemp: weather.temp });
        //     this.setState({ detailViewIcon: weather.img });
        //   }
        // }
        if (this.eventToday.isReported) {
          //show event detail

          this.setState({ detailViewTop: month + " " + item });
          this.setState({ isEventDetailModalVis: true });
          //console.log("this.state.thisMonthEvents",this.state.eventsThisMonth);
        } else {
          if (monthNum < this.state.date.getMonth()) {
            this.setState({ isReportModalVis: true });
          } else if (monthNum === this.state.date.getMonth()) {
            if (item <= this.state.date.getDate()) {
              this.setState({ isReportModalVis: true });
            } else {
              this.eventToday = planDetailList[0];
              this.setState({ isPlannedEventModalVis: true });
            }
            //show planned info
          } else {
            this.eventToday = planDetailList[0];
            this.setState({ isPlannedEventModalVis: true });
          }
        }
      } else if (planDetailList.length != 1) {
        for (let event of planDetailList) {
          if (event.isDeleted === false) {
            this.eventToday = event;
            let detailViewCalendar = [];
            for (let event of this.state.eventsThisMonth) {
              if (
                event.start.slice(0, 10) === this.eventToday.start.slice(0, 10)
              ) {
                detailViewCalendar.push(event);
              }
            }
            //let currDate = parseInt(this.eventToday.end.slice(8, 10));
            this.setState({ detailViewCalendar: detailViewCalendar });

            let currMonthNum = parseInt(this.eventToday.end.slice(5, 7));

            let currDate = parseInt(this.eventToday.end.slice(8, 10));
            // let weatherList = [];
            // if (currMonthNum === this.state.date.getMonth() + 1) {
            //   weatherList = this.thisMonthWeather;
            // } else {
            //   weatherList = this.lastMonthWeather;
            // }
            // for (let weather of weatherList) {
            //   if (weather.date === currDate) {
            //     this.setState({ detailViewTemp: weather.temp });
            //     this.setState({ detailViewIcon: weather.img });
            //   }
            // }
            // this.setState({ detailViewTop: month + " " + item });

            if (monthNum < this.state.date.getMonth()) {
              if (!this.eventToday.isReported) {
                this.setState({ isReportModalVis: true });
              } else {
                this.setState({ isEventDetailModalVis: true });
              }
            } else if (monthNum === this.state.date.getMonth()) {
              if (item <= this.state.date.getDate()) {
                if (!this.eventToday.isReported) {
                  this.setState({ isReportModalVis: true });
                } else {
                  this.setState({ isEventDetailModalVis: true });
                }
              } else {
                this.setState({ isPlannedEventModalVis: true });
              }
            }
          }
        }
      }
    }
  };

  resetReport = () => {
    this.setState({ isReportModalVis: false });
    this.setState({ feeling: "Neutral" });
    this.setState({ isActivityCompleted: false });
    this.setState({ isOtherActivity: false });
    this.setState({ isFirstStepVis: "flex" });
    this.setState({ isSecondYesStepVis: "none" });
    this.setState({ isThirdYesStepVis: "none" });
    this.setState({ isSecondNoStepVis: "none" });
    this.setState({ isThirdNoStepVis: "none" });
    this.setState({ isNoEventDayReportModalVis: "none" });

    this.setState({ nextBtnState: "next" });
    this.setState({ btnName: "Next" });
    this.setState({ isBackBtnVis: true });
    this.setState({ reason: "" });
    this.setState({ otherActivity: "" });
  };
  // updateMonthCalView = () => {
  //   let newListByActivity = this.state.newListByActivity;
  //   console.log("newListByActivity",this.state.newListByActivity);
  //   this.setState({eventsThisMonth:newListByActivity});
  //   console.log("updateMonthCalView()",this.state.eventsThisMonth);
  // }
  onPlanBtnPressed = async () => {
    if (this.state.isPlannedToday) {
      Alert.alert(
        "You already planned today",
        "You could delete the planned activity on " +
          this.state.isPlannedDate +
          " and start a new one",
        [{ text: "OK", onPress: () => console.log("OK Pressed") }]
      );
      return;
    }
    if (!this.selectedActivity) {
      Alert.alert("Please select an activity", "Activity Type Missing", [
        { text: "OK", onPress: () => console.log("OK Pressed") },
      ]);
      return;
    }
    let todayDate = new Date();
    if (this.state.timePickerDate <= todayDate) {
      Alert.alert("Please plan for tomorrow", "Wrong date", [
        { text: "OK", onPress: () => console.log("OK Pressed") },
      ]);
      return;
    }
    if (
      this.state.timePickerDate.getMonth() === todayDate.getMonth() &&
      this.state.timePickerDate.getDate() === todayDate.getDate()
    ) {
      Alert.alert("Please plan for tomorrow", "Wrong date", [
        { text: "OK", onPress: () => console.log("OK Pressed") },
      ]);
      return;
    }
    let planable = true;
    for (let event of this.userPlans) {
      if (event.title && event.isDeleted === false) {
        let eventDate = new Date(event.start);
        if (
          eventDate.getMonth() === this.state.timePickerDate.getMonth() &&
          eventDate.getDate() === this.state.timePickerDate.getDate()
        ) {
          console.log("event.title", event);
          planable = false;
        }
      }
    }
    if (!planable) {
      Alert.alert("Can't plan two event on a same day", "Pick another day", [
        {
          text: "OK",
          onPress: () => {
            planable = true;
          },
        },
      ]);
      return;
    }
    let item = this.state.timePickerDate.getDate();
    let month = this.state.timePickerDate.getMonth() + 1;
    let monthNum = "";
    let dateNum = "";
    if (item < 10) {
      dateNum = "0" + item.toString();
    } else {
      dateNum = item.toString();
    }
    if (month < 10) {
      monthNum = "0" + month;
    }
    let year = new Date().getFullYear();

    let startMinutes = moment(this.state.timePickerDate).format("HH:mm:ss");
    let endMinutes = moment(this.state.timePickerDate)
      .add(30, "minutes")
      .format("HH:mm:ss");
    let date = year + "-" + monthNum + "-" + dateNum + "T";
    let startTime = date + startMinutes;
    let endTime = date + endMinutes;
    let activityName = this.selectedActivity;
    let newEvent = {
      start: startTime,
      end: endTime,
      id: startTime + endTime,
      isPlanned: "planned",
      isReported: false,
      isCompleted: false,
      isDeleted: false,
      color: "white",
      title: activityName,
    };
    // console.log(this.state.eventsThisMonth);
    if (parseInt(monthNum) === this.state.date.getMonth() + 1) {
      this.combinedEventListThis.push(newEvent);
      await this.setState({ eventsThisMonth: this.combinedEventListThis });
    } else {
      this.combinedEventListNext.push(newEvent);
      await this.setState({ eventsThisMonth: this.combinedEventListNext });
    }
    // let newEventList = this.eventsThisMonth;
    // console.log("newEventList", newEventList);
    // newEventList.push(newEvent);
    // await this.setState({ eventsThisMonth: newEventList });
    console.log("updateEvent in main view");
    this._panel.hide();
    //this.updateView();

    let timeStamp = moment(new Date()).format();

    newEvent.timeStamp = timeStamp;
    newEvent.isReported = false;
    newEvent.activityReminderKey = await this.dataModel.scheduleNotification(
      newEvent
    );

    newEvent.reportReminderKey =
      await this.dataModel.scheduleReportNotification(newEvent);
    await this.dataModel.createNewPlan(this.userKey, newEvent);
    await this.dataModel.loadUserPlans(this.userKey);
    this.userPlans = this.dataModel.getUserPlans();
    let updateNewEventFromFireBase;
    for (let event of this.userPlans) {
      if (event.timeStamp === timeStamp) {
        updateNewEventFromFireBase = event;
      }
    }

    let updateFuturePlanList = this.state.futurePlans;

    updateFuturePlanList.push(updateNewEventFromFireBase);
    updateFuturePlanList.sort((a, b) => {
      return new Date(a.start) - new Date(b.start);
    });
    this.setState({ futurePlans: updateFuturePlanList });
    this.setState({ isPlannedToday: true });
    this.setState({ isPlannedDate: newEvent.start });
    Alert.alert(
      "Activity Planned",
      newEvent.title +
        " planned at " +
        newEvent.start.slice(11, 16) +
        " on " +
        month +
        "/" +
        item,
      [{ text: "OK", onPress: () => console.log("OK Pressed") }]
    );
    // this.setState({
    //   panelTop:
    //     newEvent.title +
    //     " planned at " +
    //     newEvent.start.slice(11, 16) +
    //     " on " +
    //     month +
    //     "/" +
    //     item,
    // });
    //this.componentWillMount
    // this.monthCalRef.current.reSetEvents(this.state.eventsThisMonth);
  };
  onDeletePressed = async () => {
    //console.log(this.eventToday);

    this.setState({ isPlannedEventModalVis: false });
    this.eventToday.isDeleted = true;
    await this.dataModel.updatePlan(this.userKey, this.eventToday);
    await this.dataModel.deleteReminders(this.eventToday);
    let monthNum = parseInt(this.eventToday.end.slice(5, 7));
    if (monthNum === this.state.date.getMonth() + 1) {
      let deleteIndex;
      //let deleteItem;
      for (let event of this.combinedEventListThis) {
        if (event.timeStamp === this.eventToday.timeStamp) {
          deleteIndex = this.combinedEventListThis.indexOf(event);
        }
      }
      this.combinedEventListThis.splice(deleteIndex, 1);
      await this.setState({ eventsThisMonth: this.combinedEventListThis });
    } else {
      let deleteIndex;
      for (let event of this.combinedEventListNext) {
        if (event.timeStamp === this.eventToday.timeStamp) {
          deleteIndex = this.combinedEventListNext.indexOf(event);
        }
      }
      this.combinedEventListNext.splice(deleteIndex, 1);
      await this.setState({ eventsThisMonth: this.combinedEventListNext });
    }
    //this.updateView();
  };
  updateView = () => {
    //console.log("this.state.eventsThisMonth", this.state.eventsThisMonth);
    if (!this.state.isFromWeekView) {
      this.monthCalRef.current.processEvents();

      this.setState({ isMonthCalVis: true });
      this.setState({ indexView: "Month" });
    } else {
      //this.setState({isMonthCalVis:true});
      this.setState({ isMonthCalVis: true });
      this.setState({ indexView: "Week" });
    }
  };

  render() {
    let planTodayView;
    if (this.state.todayPlan.length != 0) {
      planTodayView = (
        <FlatList
          data={this.state.todayPlan}
          contentContainerStyle={{
            justifyContent: "center",
            alignItems: "center",
          }}
          renderItem={({ item }) => {
            return (
              <View
                style={{
                  backgroundColor: "white",
                  borderRadius: 30,
                  borderWidth: 2,
                  width: 300,
                  borderColor: "black",
                  margin: 5,
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <View style={{ flex: 0.8 }}>
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: "bold",
                      marginLeft: 20,
                      marginTop: 5,
                    }}
                  >
                    {item.title}
                  </Text>
                  <Text style={{ marginLeft: 20, marginBottom: 5 }}>
                    {item.start.slice(5, 10)} at {item.start.slice(11, 16)}
                  </Text>
                </View>
                <View style={{ flex: 0.2, marginRight: 20 }}>
                  <TouchableOpacity
                    disabled={false}
                    onPress={() => {
                      this.eventToday = item;
                      this.setState({ isReportModalVis: true });
                      // let updateList = this.state.pastPlans;
                      // let index = updateList.indexOf(item);
                      // if (index > -1) {
                      //   updateList.splice(index, 1);
                      // }
                      // this.setState({ pastPlans: updateList });
                    }}
                    style={{
                      backgroundColor: "black",
                      color: "white",
                      width: 60,
                      height: 25,
                      borderRadius: 30,
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        color: "white",
                        fontWeight: "bold",
                        fontSize: 15,
                      }}
                    >
                      Report
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      );
    } else {
      planTodayView = (
        <Text style={{ fontSize: 16, fontWeight: "bold" }}>
          No Activity Planned for today
        </Text>
      );
    }

    return (
      <View
        style={{
          alignContent: "center",
          width: "100%",
          height: "100%",
          flexDirection: "column",
          justifyContent: "flex-end",
        }}
      >
        {/* noEventDayReport */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={this.state.isNoEventDayReportModalVis}
          onRequestClose={() => {
            Alert.alert("Modal has been closed");
          }}
        >
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              //backgroundColor:"red"
            }}
          >
            <View
              style={{
                flex: 0.6,
                width: "95%",
                backgroundColor: "white",
                borderWidth: 2,
                borderColor: "black",
                flexDirection: "column",
                justifyContent: "space-between",
                alignItems: "center",
                borderRadius: 15,
              }}
            >
              <View
                style={{
                  flex: 0.05,
                  width: "100%",
                  flexDirection: "row",
                  justifyContent: "flex-end",
                }}
              >
                <View>
                  <TouchableOpacity
                    onPress={() => {
                      this.setState({ isNoEventDayReportModalVis: false });
                      // this.setState({ feeling: "Neutral" });
                      // this.setState({ isActivityCompleted: false });
                      // this.setState({ isOtherActivity: false });
                      // this.setState({ isFirstStepVis: "flex" });
                      // this.setState({ isSecondYesStepVis: "none" });
                      // this.setState({ isThirdYesStepVis: "none" });
                      // this.setState({ isSecondNoStepVis: "none" });
                      // this.setState({ isThirdNoStepVis: "none" });
                      // this.setState({ nextBtnState: "next" });
                      // this.setState({ otherActivity: "" });

                      this.resetReport();
                    }}
                  >
                    <MaterialIcons name="cancel" size={24} color="black" />
                  </TouchableOpacity>
                </View>
              </View>
              <View
                style={{
                  flex: 0.2,
                  width: "80%",
                  marginTop: 0,
                  //backgroundColor:"red"
                }}
              >
                <Text style={{ fontSize: 24, fontWeight: "bold" }}>
                  Tell us about your day!
                </Text>
                <Text
                  style={{ fontSize: 14, fontWeight: "bold", marginTop: 5 }}
                >
                  The following questions only take seconds to complete
                </Text>
              </View>

              <View
                style={{
                  flex: 0.8,
                  width: "80%",
                  //backgroundColor: "red",
                  flexDirection: "row",
                  alignItems: "flex-start",
                  top: "20%",
                  justifyContent: "center",
                }}
              >
                <View
                  style={{
                    display: this.state.isFirstStepVis,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      fontWeight: "bold",
                      marginBottom: "10%",
                    }}
                  >
                    {/* //No event day report */}
                    Did you do any physical exercise today?
                  </Text>
                  <SwitchSelector
                    options={[
                      { label: "No", value: false },
                      { label: "Yes", value: true },
                    ]}
                    initial={0}
                    buttonMargin={5}
                    borderWidth={2}
                    borderColor="black"
                    buttonColor="black"
                    onPress={(value) =>
                      // console.log(`Call onPress with value: ${value}`)
                      {
                        this.setState({ isOtherActivity: value });
                        if (value) {
                          this.setState({ nextBtnState: "next" });
                          this.setState({ btnName: "Next" });
                        } else {
                          this.setState({ nextBtnState: "submit" });
                          this.setState({ btnName: "Submit" });
                        }
                      }
                    }
                  />
                </View>
                <View
                  style={{
                    display: this.state.isSecondYesStepVis,
                    justifyContent: "flex-start",
                    flexDirection: "column",
                    alignItems: "center",
                    width: "100%",
                  }}
                >
                  <Text
                    style={{
                      fontWeight: "bold",
                      marginBottom: "10%",
                    }}
                  >
                    Tell us what physical exercise you did?
                  </Text>
                  <View
                    style={{
                      flex: 0.1,

                      marginTop: 10,
                      width: "100%",
                      borderWidth: 2,
                      borderRadius: 30,
                      borderColor: "#6E6E6E",
                    }}
                  >
                    <TextInput
                      // secureTextEntry={true}
                      style={{
                        flex: 1,
                        marginLeft: 20,
                        marginRight: 20,
                        fontSize: 20,
                      }}
                      autoCapitalize="none"
                      autoCorrect={false}
                      value={this.state.otherActivity}
                      maxLength={35}
                      onChangeText={(text) => {
                        this.setState({ otherActivity: text });
                      }}
                    />
                  </View>
                </View>
                <View
                  style={{
                    display: this.state.isThirdYesStepVis,
                    justifyContent: "flex-start",
                    flexDirection: "column",
                    alignItems: "center",
                    width: "100%",
                  }}
                >
                  <Text
                    style={{
                      fontWeight: "bold",
                      marginBottom: "10%",
                    }}
                  >
                    How satisfied are you with today's activity?
                  </Text>
                  <SwitchSelector
                    options={[
                      { label: "😕 Negative", value: "Negative" },
                      { label: "😑 Neutral", value: "Neutral" },
                      { label: "🙂 Positive", value: "Positive" },
                    ]}
                    initial={1}
                    buttonMargin={1}
                    borderWidth={2}
                    borderColor="black"
                    buttonColor="black"
                    onPress={(value) =>
                      // console.log(`Call onPress with value: ${value}`)
                      {
                        this.setState({ feeling: value });
                      }
                    }
                  />
                </View>
                <View
                  style={{
                    display: this.state.isSecondNoStepVis,
                    justifyContent: "flex-start",
                    flexDirection: "column",
                    alignItems: "center",
                    width: "100%",
                  }}
                >
                  <Text
                    style={{
                      fontWeight: "bold",
                      marginBottom: "10%",
                    }}
                  >
                    Tell us the reason why you didn't {this.eventToday.title} as
                    planned
                  </Text>
                  <View
                    style={{
                      flex: 0.8,

                      marginTop: 10,
                      width: "100%",
                      borderWidth: 2,
                      borderRadius: 30,
                      borderColor: "#6E6E6E",
                    }}
                  >
                    <TextInput
                      // secureTextEntry={true}
                      style={{
                        flex: 1,
                        marginLeft: 20,
                        marginRight: 20,
                        fontSize: 20,
                      }}
                      maxLength={35}
                      autoCapitalize="none"
                      autoCorrect={false}
                      value={this.state.reason}
                      onChangeText={(text) => {
                        this.setState({ reason: text });
                      }}
                    />
                  </View>
                </View>
              </View>
              <View style={{ flexDirection: "row" }}>
                <Button
                  title="Back"
                  disabled={this.state.isBackBtnVis}
                  onPress={() => {
                    if (this.state.nextBtnState === "submit") {
                      if (this.state.isOtherActivity) {
                        this.setState({ isBackBtnVis: false });
                        this.setState({ isSecondYesStepVis: "flex" });
                        this.setState({ isThirdYesStepVis: "none" });
                        this.setState({ nextBtnState: "next2" });
                        this.setState({ btnName: "Next" });
                      } else {
                        this.setState({ isBackBtnVis: false });
                        this.setState({ isThirdYesStepVis: "none" });
                        this.setState({ isFirstStepVis: "flex" });
                        this.setState({ btnName: "Next" });
                        this.setState({ nextBtnState: "next" });
                      }
                    } else if (this.state.nextBtnState === "next2") {
                      this.setState({ nextBtnState: "next" });
                      this.setState({ isBackBtnVis: true });
                      this.setState({ isSecondYesStepVis: "none" });
                      this.setState({ isFirstStepVis: "flex" });
                    } else if (this.state.nextBtnState === "next2no") {
                      this.setState({ nextBtnState: "next" });
                      this.setState({ isBackBtnVis: true });
                      this.setState({ isFirstStepVis: "flex" });
                      this.setState({ isSecondNoStepVis: "none" });
                    } else if (this.state.nextBtnState === "next3no") {
                      this.setState({ nextBtnState: "next2no" });
                      this.setState({ isBackBtnVis: false });
                      this.setState({ isSecondNoStepVis: "flex" });
                      this.setState({ isThirdNoStepVis: "none" });
                    }
                  }}
                ></Button>
                <Button
                  title={this.state.btnName}
                  onPress={async () => {
                    if (this.state.nextBtnState === "submit") {
                      // this.setState({ isDailyReportBtnDisabled: true });
                      this.setState({ isNoEventDayReportModalVis: false });
                      // this.setState({ nextBtnState: "next" });

                      // this.setState({ feeling: "Neutral" });
                      // this.setState({ isActivityCompleted: false });
                      // this.setState({ isOtherActivity: false });
                      // this.setState({ isFirstStepVis: "flex" });
                      // this.setState({ isSecondYesStepVis: "none" });
                      // this.setState({ isSecondNoStepVis: "none" });
                      // this.setState({ isThirdNoStepVis: "none" });
                      // this.setState({ isThirdYesStepVis: "none" });
                      this.resetReport();

                      let dailyReport = {};
                      dailyReport.isDailyReport = true;
                      dailyReport.isExerciseToday = this.state.isOtherActivity;
                      if (this.state.isOtherActivity) {
                        dailyReport.otherActivity = this.state.otherActivity;
                        dailyReport.feeling = this.state.feeling;
                      } else {
                        dailyReport.otherActivity = "none";
                        dailyReport.feeling = "";
                      }

                      dailyReport.start = moment(new Date())
                        .format()
                        .slice(0, 10);
                      dailyReport.end = dailyReport.start;

                      let timeStamp = moment(new Date()).format();
                      dailyReport.timeStamp = timeStamp;
                      await this.dataModel.createNewPlan(
                        this.userKey,
                        dailyReport
                      );

                      // let eventToUpdate = this.eventToday;
                      // eventToUpdate.isActivityCompleted = this.state.isActivityCompleted;
                      // eventToUpdate.isReported = true;

                      // eventToUpdate.isOtherActivity = this.state.isOtherActivity;
                      // eventToUpdate.reason = this.state.reason;
                      // eventToUpdate.otherActivity = this.state.otherActivity;
                      // eventToUpdate.feeling = this.state.feeling;

                      // await this.dataModel.updatePlan(
                      //   this.userKey,
                      //   eventToUpdate
                      // );
                      let eventList = this.state.eventsThisMonth;
                      eventList.push(dailyReport);

                      await this.setState({ eventsThisMonth: eventList });
                      await this.dataModel.loadUserPlans(this.userKey);
                      this.userPlans = this.dataModel.getUserPlans();
                      this.setState({ feeling: "Neutral" });
                      //this.setState({ isOtherActivity: false });
                      this.setState({ isOtherActivity: false });
                      this.setState({ otherActivity: "" });
                      //this.updateView();
                    } else if (this.state.nextBtnState === "next") {
                      this.setState({ isBackBtnVis: false });
                      this.setState({ isFirstStepVis: "none" });
                      this.setState({ nextBtnState: "next2" });
                      if (this.state.isOtherActivity) {
                        //this.setState({ submitBtnState: true });
                        this.setState({ isSecondYesStepVis: "flex" });
                        //this.setState({ isButtonFirstStage: false });
                      } else {
                        this.setState({ nextBtnState: "submit" });
                        this.setState({ btnName: "Submit" });
                        //this.setState({ submitBtnState: false });
                        this.setState({ isThirdYesStepVis: "flex" });
                      }
                    } else if (
                      this.state.nextBtnState === "next2" ||
                      this.state.nextBtnState === "next3no"
                    ) {
                      this.setState({ btnName: "Submit" });
                      this.setState({ nextBtnState: "submit" });
                      this.setState({ isSecondYesStepVis: "none" });
                      this.setState({ isThirdYesStepVis: "flex" });
                      this.setState({ isThirdNoStepVis: "none" });
                    } else if (this.state.nextBtnState === "next2no") {
                      this.setState({ btnName: "next" });
                      this.setState({ nextBtnState: "next3no" });
                      this.setState({ isSecondNoStepVis: "none" });
                      this.setState({ isThirdNoStepVis: "flex" });
                    }
                  }}
                ></Button>
              </View>
            </View>
          </View>
        </Modal>
        {/* Plan Report */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={this.state.isReportModalVis}
          onRequestClose={() => {
            Alert.alert("Modal has been closed");
          }}
        >
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
            }}
          >
            <View
              style={{
                flex: 0.5,
                width: "95%",
                backgroundColor: "white",

                borderWidth: 2,
                borderColor: "black",
                flexDirection: "column",
                justifyContent: "space-between",
                alignItems: "center",
                borderRadius: 15,
              }}
            >
              {/* <SectionList
                sections={reportOptions}
                renderItem={({ item }) => {
                  let color = item.color;
                  return <Text style={{ color: color }}>{item.text}</Text>;
                }}
              /> */}
              <View
                style={{
                  flex: 0.1,
                  width: "100%",
                  flexDirection: "row",
                  justifyContent: "flex-end",
                }}
              >
                <View>
                  <TouchableOpacity
                    onPress={() => {
                      this.resetReport();
                    }}
                  >
                    <MaterialIcons name="cancel" size={24} color="black" />
                  </TouchableOpacity>
                </View>
              </View>
              <View
                style={{
                  flex: 0.25,
                  width: "80%",
                  marginTop: 0,
                  //backgroundColor: "blue",
                }}
              >
                <Text style={{ fontSize: 24, fontWeight: "bold" }}>
                  Tell us about your day!
                </Text>
                <Text
                  style={{ fontSize: 14, fontWeight: "bold", marginTop: 5 }}
                >
                  The following questions only take seconds to complete
                </Text>
              </View>
              <View
                style={{
                  flex: 1,
                  width: "80%",
                  //backgroundColor: "red",
                  flexDirection: "row",
                  alignItems: "flex-start",
                  justifyContent: "center",
                }}
              >
                <View
                  style={{
                    display: this.state.isFirstStepVis,
                    justifyContent: "center",
                    alignItems: "center",
                    marginTop: "10%",
                  }}
                >
                  <Text
                    style={{
                      fontWeight: "bold",
                      marginBottom: "10%",
                    }}
                  >
                    You planned {this.eventToday.title} on{" "}
                    {this.eventToday.start.slice(5, 10)} at{" "}
                    {this.eventToday.start.slice(11, 16)} for 30 min, did you
                    followed your plan?
                  </Text>
                  <SwitchSelector
                    options={[
                      { label: "No", value: false },
                      { label: "Yes", value: true },
                    ]}
                    initial={0}
                    buttonMargin={5}
                    borderWidth={2}
                    borderColor="black"
                    buttonColor="black"
                    onPress={(value) =>
                      // console.log(`Call onPress with value: ${value}`)
                      {
                        this.setState({ isActivityCompleted: value });
                      }
                    }
                  />
                </View>
                <View
                  style={{
                    display: this.state.isSecondYesStepVis,
                    width: "100%",
                  }}
                >
                  <Text
                    style={{
                      fontWeight: "bold",
                      marginBottom: "10%",
                      marginTop: "20%",
                    }}
                  >
                    Did you engage yourself in any physical exercise?
                  </Text>
                  <SwitchSelector
                    options={[
                      { label: "No", value: false },
                      { label: "Yes", value: true },
                    ]}
                    initial={this.state.secSwitchSelectorInitVal}
                    buttonMargin={5}
                    borderWidth={2}
                    borderColor="black"
                    buttonColor="black"
                    onPress={(value) =>
                      // console.log(`Call onPress with value: ${value}`)

                      {
                        this.setState({ isOtherActivity: value });
                        console.log("SwitchSelector value", value);
                        if (value) {
                          this.setState({ btnName: "Next" });
                          this.setState({ nextBtnState: "next3no" });
                        } else {
                          this.setState({ btnName: "Submit" });
                          this.setState({ nextBtnState: "submit" });
                        }
                      }
                    }
                  />
                </View>
                <View
                  style={{
                    display: this.state.isThirdYesStepVis,
                    width: "100%",
                  }}
                >
                  <Text
                    style={{
                      fontWeight: "bold",
                      marginBottom: "10%",
                      marginTop: "20%",
                    }}
                  >
                    How satisfied are you with today's activity?
                  </Text>
                  <SwitchSelector
                    options={[
                      { label: "😕 Negative", value: "Negative" },
                      { label: "😑 Neutral", value: "Neutral" },
                      { label: "🙂 Positive", value: "Positive" },
                    ]}
                    initial={1}
                    buttonMargin={1}
                    borderWidth={2}
                    borderColor="black"
                    buttonColor="black"
                    onPress={(value) =>
                      // console.log(`Call onPress with value: ${value}`)
                      {
                        this.setState({ feeling: value });
                      }
                    }
                  />
                </View>
                <View
                  style={{
                    display: this.state.isSecondNoStepVis,
                    width: "100%",
                  }}
                >
                  <Text
                    style={{
                      fontWeight: "bold",
                      marginBottom: "10%",
                      marginTop: "20%",
                    }}
                  >
                    Tell us the reason why you didn't {this.eventToday.title} as
                    planned
                  </Text>
                  <View
                    style={{
                      flex: 0.15,

                      marginTop: 10,
                      width: "100%",
                      borderWidth: 2,
                      borderRadius: 30,
                      borderColor: "#6E6E6E",
                    }}
                  >
                    <TextInput
                      // secureTextEntry={true}
                      style={{
                        flex: 1,
                        marginLeft: 20,
                        marginRight: 20,
                        fontSize: 20,
                      }}
                      maxLength={35}
                      autoCapitalize="none"
                      autoCorrect={false}
                      value={this.state.reason}
                      onChangeText={(text) => {
                        this.setState({ reason: text });
                      }}
                    />
                  </View>
                </View>
                <View
                  style={{
                    display: this.state.isThirdNoStepVis,
                    width: "100%",
                  }}
                >
                  <Text
                    style={{
                      fontWeight: "bold",
                      marginBottom: "10%",
                      marginTop: "20%",
                    }}
                  >
                    Did you do any other activities?
                  </Text>
                  <View
                    style={{
                      flex: 0.15,

                      marginTop: 10,
                      width: "100%",
                      borderWidth: 2,
                      borderRadius: 30,
                      borderColor: "#6E6E6E",
                    }}
                  >
                    <TextInput
                      // secureTextEntry={true}
                      style={{
                        flex: 1,
                        marginLeft: 20,
                        marginRight: 20,
                        fontSize: 20,
                      }}
                      autoCapitalize="none"
                      autoCorrect={false}
                      value={this.state.otherActivity}
                      maxLength={35}
                      onChangeText={(text) => {
                        this.setState({ otherActivity: text });
                      }}
                    />
                  </View>
                </View>
              </View>
              <View style={{ flexDirection: "row" }}>
                <Button
                  title="Back"
                  disabled={this.state.isBackBtnVis}
                  onPress={() => {
                    // console.log(
                    //   "back pressed: this.state.nextBtnState",
                    //   this.state.nextBtnState

                    // );
                    // console.log("================================");
                    // console.log("this.state.feeling", this.state.feeling);
                    // console.log(
                    //   "this.state.isActivityCompleted",
                    //   this.state.isActivityCompleted
                    // );
                    // console.log(
                    //   "this.state.isOtherActivity",
                    //   this.state.isOtherActivity
                    // );
                    // console.log("this.state.reason", this.state.reason);
                    // console.log(
                    //   "this.state.otherActivity",
                    //   this.state.otherActivity
                    // );
                    // console.log("================================");
                    if (this.state.nextBtnState === "submit") {
                      if (this.state.isActivityCompleted) {
                        this.setState({ isBackBtnVis: true });
                        this.setState({ isFirstStepVis: "flex" });
                        this.setState({ isThirdYesStepVis: "none" });
                        this.setState({ nextBtnState: "next" });
                        this.setState({ btnName: "Next" });
                      } else {
                        if (this.state.isOtherActivity) {
                          this.setState({ isBackBtnVis: false });
                          this.setState({ isThirdYesStepVis: "none" });
                          this.setState({ isThirdNoStepVis: "flex" });
                          this.setState({ btnName: "Next" });
                          this.setState({ nextBtnState: "next4no" });
                        } else {
                          this.setState({ isSecondYesStepVis: "none" });
                          this.setState({ isSecondNoStepVis: "flex" });
                          this.setState({ btnName: "Next" });
                          this.setState({ nextBtnState: "next2no" });
                          //this.setState({ isOtherActivity: })
                        }
                      }
                    } else if (this.state.nextBtnState === "next2") {
                      this.setState({ nextBtnState: "next" });
                      this.setState({ isBackBtnVis: true });
                      this.setState({ isSecondYesStepVis: "none" });
                      this.setState({ isFirstStepVis: "flex" });
                    } else if (this.state.nextBtnState === "next2no") {
                      this.setState({ nextBtnState: "next" });
                      this.setState({ isBackBtnVis: true });
                      this.setState({ isFirstStepVis: "flex" });
                      this.setState({ isSecondNoStepVis: "none" });
                      //this.setState({ reason: "" });
                      this.setState({ isActivityCompleted: false });
                    } else if (this.state.nextBtnState === "next3no") {
                      this.setState({ nextBtnState: "next2no" });
                      this.setState({ isBackBtnVis: false });
                      this.setState({ isSecondNoStepVis: "flex" });
                      this.setState({ isSecondYesStepVis: "none" });
                      this.setState({ isOtherActivity: "no records" });
                    } else if (this.state.nextBtnState === "next4no") {
                      this.setState({ isThirdNoStepVis: "none" });
                      this.setState({ isSecondYesStepVis: "flex" });
                      this.setState({ nextBtnState: "next3no" });
                      this.setState({ isOtherActivity: true });
                      //this.setState({ otherActivity: "" });
                      //this.setState({ secSwitchSelectorInitVal: 0});
                    }
                  }}
                ></Button>
                <Button
                  title={this.state.btnName}
                  onPress={async () => {
                    // console.log(
                    //   "this.state.nextBtnState",
                    //   this.state.nextBtnState
                    // );
                    // console.log("================================");
                    // console.log("this.state.feeling", this.state.feeling);
                    // console.log(
                    //   "this.state.isActivityCompleted",
                    //   this.state.isActivityCompleted
                    // );
                    // console.log(
                    //   "this.state.isOtherActivity",
                    //   this.state.isOtherActivity
                    // );
                    // console.log("this.state.reason", this.state.reason);
                    // console.log(
                    //   "this.state.otherActivity",
                    //   this.state.otherActivity
                    // );
                    // console.log("================================");

                    if (this.state.nextBtnState === "submit") {
                      // this.setState({ isReportModalVis: false });
                      // this.setState({ nextBtnState: "next" });

                      // this.setState({ feeling: "Neutral" });
                      // this.setState({ isActivityCompleted: false });
                      // this.setState({ isOtherActivity: false });
                      // this.setState({ isFirstStepVis: "flex" });
                      // this.setState({ isSecondYesStepVis: "none" });
                      // this.setState({ isSecondNoStepVis: "none" });
                      // this.setState({ isThirdNoStepVis: "none" });
                      // this.setState({ isThirdYesStepVis: "none" });

                      this.resetReport();

                      let eventToUpdate = this.eventToday;
                      eventToUpdate.isActivityCompleted =
                        this.state.isActivityCompleted;
                      eventToUpdate.isReported = true;
                      if (this.state.isActivityCompleted) {
                        eventToUpdate.isOtherActivity = "";
                        eventToUpdate.reason = "";
                      } else {
                        eventToUpdate.isOtherActivity =
                          this.state.isOtherActivity;
                        eventToUpdate.reason = this.state.reason;
                        if (this.state.isOtherActivity) {
                          eventToUpdate.otherActivity =
                            this.state.otherActivity;
                        } else {
                          eventToUpdate.otherActivity = "";
                        }
                      }

                      if (
                        !this.state.isActivityCompleted &&
                        !this.state.isOtherActivity
                      ) {
                        eventToUpdate.feeling = "";
                      } else {
                        eventToUpdate.feeling = this.state.feeling;
                      }

                      await this.dataModel.updatePlan(
                        this.userKey,
                        eventToUpdate
                      );
                      let eventList = this.state.eventsThisMonth;

                      await this.setState({ eventsThisMonth: eventList });
                      await this.dataModel.loadUserPlans(this.userKey);
                      this.setState({ feeling: "Neutral" });
                      this.setState({ isActivityCompleted: false });
                      this.setState({ isOtherActivity: false });
                      this.userPlans = this.dataModel.getUserPlans();
                      //this.updateView();

                      let todayDate = new Date();
                      let eventDate = new Date(this.eventToday.start);
                      let updateList = [];
                      if (
                        todayDate.getDate() === eventDate.getDate() &&
                        todayDate.getMonth() === eventDate.getMonth()
                      ) {
                        updateList = this.state.todayPlan;
                        console.log("updateList", updateList);
                        let index = updateList.indexOf(this.eventToday);
                        if (index > -1) {
                          updateList.splice(index, 1);
                        }
                        this.setState({ todayPlan: updateList });
                      } else {
                        updateList = this.state.pastPlans;
                        let index = updateList.indexOf(this.eventToday);
                        if (index > -1) {
                          updateList.splice(index, 1);
                        }
                        this.setState({ pastPlans: updateList });
                      }
                    } else if (this.state.nextBtnState === "next") {
                      this.setState({ isBackBtnVis: false });
                      this.setState({ isFirstStepVis: "none" });
                      this.setState({ nextBtnState: "next2" });
                      if (this.state.isActivityCompleted) {
                        this.setState({ submitBtnState: true });
                        this.setState({ isThirdYesStepVis: "flex" });
                        this.setState({ btnName: "Submit" });
                        this.setState({ nextBtnState: "submit" });
                        //this.setState({ isButtonFirstStage: false });
                      } else {
                        this.setState({ nextBtnState: "next2no" });
                        this.setState({ btnName: "Next" });
                        this.setState({ submitBtnState: false });
                        this.setState({ isSecondNoStepVis: "flex" });
                      }
                    } else if (
                      this.state.nextBtnState === "next2" ||
                      this.state.nextBtnState === "next3no"
                    ) {
                      this.setState({ isSecondYesStepVis: "none" });
                      //this.setState({ btnName: "Submit" });
                      //this.setState({ nextBtnState: "submit" });
                      // this.setState({ isSecondYesStepVis: "none" });
                      // this.setState({ isThirdYesStepVis: "flex" });
                      // this.setState({ isThirdNoStepVis: "none" });
                      if (this.state.isOtherActivity) {
                        this.setState({ isThirdNoStepVis: "flex" });
                        this.setState({ btnName: "Next" });
                        this.setState({ nextBtnState: "next4no" });
                      } else {
                        this.setState({ isThirdNoStepVis: "none" });
                        this.setState({ btnName: "Submit" });
                        this.setState({ nextBtnState: "submit" });
                      }
                    } else if (this.state.nextBtnState === "next2no") {
                      this.setState({ btnName: "Next" });
                      this.setState({ nextBtnState: "next3no" });
                      this.setState({ isSecondNoStepVis: "none" });
                      this.setState({ isSecondYesStepVis: "flex" });
                      if (!this.state.isOtherActivity) {
                        this.setState({ isThirdNoStepVis: "none" });
                        this.setState({ btnName: "Submit" });
                        this.setState({ nextBtnState: "submit" });
                      }
                    } else if (this.state.nextBtnState === "next4no") {
                      this.setState({ isThirdNoStepVis: "none" });
                      this.setState({ isThirdYesStepVis: "flex" });
                      this.setState({ btnName: "Submit" });
                      this.setState({ nextBtnState: "submit" });
                    }
                    // else if (this.state.nextBtnState === "next4no") {
                    //   this.setState({ isThirdNoStepVis: "none" });
                    //   this.setState({ btnName: "Submit" });
                    //   this.setState({ nextBtnState: "submit" });

                    // }
                  }}
                ></Button>
              </View>
            </View>
          </View>
        </Modal>
        <View
          style={{
            width: "100%",
            height: "100%",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            top: "5%",
            //backgroundColor:"blue"
          }}
        >
          <View
            style={{
              width: "100%",
              height: "100%",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <View
              style={{
                marginTop: "5%",
                flex: 0.1,
                width: "75%",
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                //backgroundColor:"red"
              }}
            >
              <Text style={{ fontSize: 25, fontWeight: "bold" }}>
                Activity Today
              </Text>
              <TouchableOpacity
                style={{
                  backgroundColor: "black",
                  color: "white",
                  width: 100,
                  height: 25,
                  borderRadius: 30,
                  justifyContent: "center",
                  alignItems: "center",
                }}
                // disabled={this.state.isDailyReportBtnDisabled}
                disabled={false}
                onPress={
                  () => {
                    this.props.navigation.navigate("ReportCollection", {
                      userKey: this.userKey,
                      userPlans: this.userPlans,
                    });
                  }
                  // this.setState({ isNoEventDayReportModalVis: true })
                }
              >
                <Text
                  style={{ color: "white", fontWeight: "bold", fontSize: 8 }}
                >
                  Unfinished Reports
                </Text>
              </TouchableOpacity>
            </View>
            <View style={{ flex: 0.1 }}>{planTodayView}</View>

            <View
              style={{
                flex: 0.1,
                width: "75%",
                justifyContent: "center",
                alignItems: "flex-start",
              }}
            >
              <Text style={{ fontSize: 25, fontWeight: "bold" }}>
                Past Activities
              </Text>
            </View>

            <View
              style={{
                flex: 0.2,
                justifyContent: "flex-start",
                alignItems: "center",
                flexDirection: "column",
                width: "100%",
              }}
            >
              <FlatList
                data={this.state.pastPlans}
                style={{ flex: 0.8 }}
                contentContainerStyle={{
                  justifyContent: "flex-start",
                  alignItems: "center",
                  // backgroundColor: "blue",
                }}
                renderItem={({ item }) => {
                  return (
                    <View
                      style={{
                        backgroundColor: "white",
                        borderRadius: 30,
                        borderWidth: 2,
                        width: 300,
                        borderColor: "black",
                        margin: 5,
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <View style={{ flex: 0.8 }}>
                        <Text
                          style={{
                            fontSize: 15,
                            fontWeight: "bold",
                            marginLeft: 20,
                            marginTop: 5,
                          }}
                        >
                          {item.title}
                        </Text>
                        <Text style={{ marginLeft: 20, marginBottom: 5 }}>
                          {item.start.slice(5, 10)} at{" "}
                          {item.start.slice(11, 16)}
                        </Text>
                      </View>
                      <View style={{ flex: 0.2, marginRight: 20 }}>
                        <TouchableOpacity
                          disabled={false}
                          onPress={() => {
                            this.eventToday = item;
                            this.setState({ isReportModalVis: true });
                            // let updateList = this.state.pastPlans;
                            // let index = updateList.indexOf(item);
                            // if (index > -1) {
                            //   updateList.splice(index, 1);
                            // }
                            // this.setState({ pastPlans: updateList });
                          }}
                          style={{
                            backgroundColor: "black",
                            color: "white",
                            width: 60,
                            height: 25,
                            borderRadius: 30,
                            justifyContent: "center",
                            alignItems: "center",
                          }}
                        >
                          <Text
                            style={{
                              color: "white",
                              fontWeight: "bold",
                              fontSize: 15,
                            }}
                          >
                            Report
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                }}
              />
            </View>
            <View
              style={{
                // position: "absolute",
                // top: "5%",
                width: "75%",
                justifyContent: "center",
                alignItems: "flex-start",
                // backgroundColor: "red",
                marginBottom: 30,
                flex: 0.05,
              }}
            >
              <Text style={{ fontSize: 25, fontWeight: "bold" }}>
                Future Activities
              </Text>
            </View>
            <View
              style={{
                flex: 0.6,
                justifyContent: "flex-start",
                alignItems: "center",
                height: "100%",
                // backgroundColor: "red",
              }}
            >
              <FlatList
                data={this.futurePlans}
                // style={{ height: "100%" }}
                contentContainerStyle={{
                  justifyContent: "flex-start",
                  alignItems: "center",
                  paddingBottom: 20,
                  //backgroundColor: "blue",
                }}
                renderItem={({ item }) => {
                  return (
                    <View
                      style={{
                        backgroundColor: "white",
                        borderRadius: 30,
                        borderWidth: 2,
                        width: 300,
                        borderColor: "black",
                        margin: 5,
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <View style={{ flex: 0.8 }}>
                        <Text
                          style={{
                            fontSize: 15,
                            fontWeight: "bold",
                            marginLeft: 20,
                            marginTop: 5,
                          }}
                        >
                          {item.title}
                        </Text>
                        <Text style={{ marginLeft: 20, marginBottom: 5 }}>
                          {item.start.slice(5, 10)} at{" "}
                          {item.start.slice(11, 16)}
                        </Text>
                      </View>
                      <View style={{ flex: 0.2, marginRight: 20 }}>
                        <TouchableOpacity
                          disabled={false}
                          onPress={async () => {
                            console.log("delete item", item);
                            await this.dataModel.deleteReminders(item);
                            item.isDeleted = true;
                            if (
                              item.timeStamp.slice(0, 10) ===
                              moment(new Date()).format().slice(0, 10)
                            ) {
                              this.setState({ isPlannedToday: false });
                            }
                            await this.dataModel.updatePlan(this.userKey, item);

                            let updateList = this.state.futurePlans;
                            let index = updateList.indexOf(item);
                            if (index > -1) {
                              updateList.splice(index, 1);
                            }

                            await this.setState({ futurePlans: updateList });

                            await this.dataModel.loadUserPlans(this.userKey);
                            this.userPlans = this.dataModel.getUserPlans();
                            for (let event of this.userPlans) {
                              if (event.key === item.key) {
                                event.isDeleted = true;
                              }
                            }
                          }}
                          style={{
                            backgroundColor: "black",
                            color: "white",
                            width: 60,
                            height: 25,
                            borderRadius: 30,
                            justifyContent: "center",
                            alignItems: "center",
                          }}
                        >
                          <Text
                            style={{
                              color: "white",
                              fontWeight: "bold",
                              fontSize: 15,
                            }}
                          >
                            Delete
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                }}
              />
            </View>
          </View>
        </View>
        <SlidingUpPanel
          draggableRange={{ top: 400, bottom: 100 }}
          showBackdrop={false}
          ref={(c) => (this._panel = c)}
        >
          <View
            style={{
              height: 400,
              justifyContent: "space-between",
              flexDirection: "column",
              alignItems: "center",
              borderRadius: 40,
              backgroundColor: "#BDBDBD",
            }}
          >
            <View
              style={{
                flex: 0.4,
                flexDirection: "column",
                width: "90%",
                borderRadius: 20,
                justifyContent: "center",
                marginTop: 20,
                backgroundColor: "white",
              }}
            >
              <View
                style={{
                  flex: 0.5,
                  flexDirection: "row",
                  justifyContent: "space-between",
                  //backgroundColor:"red"
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "bold",
                      color: "black",
                      marginTop: 10,
                      marginLeft: 10,
                    }}
                  >
                    {this.state.panelTop}
                  </Text>
                </View>
                <View
                  style={{
                    flex: 1,
                    flexDirection: "row",
                    justifyContent: "flex-end",
                    alignItems: "flex-end",
                  }}
                >
                  <DateTimePicker
                    value={this.state.timePickerDate}
                    mode="date"
                    is24Hour={true}
                    display="calendar"
                    onChange={async (e, date) => {
                      this.setState({ timePickerDate: date });
                      console.log(this.state.timePickerDate);
                    }}
                    style={{
                      width: "100%",
                      alignSelf: "center",
                      flexWrap: "wrap",
                      height: 40,
                    }}
                  />
                </View>
              </View>
            </View>
            <View
              style={{
                flex: 0.4,
                width: "90%",
                borderRadius: 20,
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: 20,
                backgroundColor: "#6E6E6E",
              }}
            >
              <View
                style={{
                  flex: 1,
                  flexDirection: "row",
                  width: "95%",
                  height: "90%",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingLeft: 10,
                  paddingRight: 10,
                  marginBottom: 10,

                  //backgroundColor: "white",
                  borderRadius: 15,
                  //backgroundColor: "blue",
                }}
              >
                <View
                  style={{
                    flex: 0.5,
                    marginRight: 5,
                    flexDirection: "column",
                    height: "100%",
                    justifyContent: "space-between",
                  }}
                >
                  <View style={{ flex: 0.5, justifyContent: "center" }}>
                    <Text
                      style={{
                        margin: 5,
                        fontWeight: "bold",
                        textAlign: "center",
                        fontSize: 14,
                        color: "white",
                      }}
                    >
                      Activity
                    </Text>
                  </View>
                  <View
                    style={{
                      flex: 0.5,
                      justifyContent: "center",
                      alignItems: "center",
                      backgroundColor: "white",
                      borderRadius: 20,
                    }}
                  >
                    <ModalSelector
                      style={{ borderWidth: 0 }}
                      // touchableStyle={{ color: "white" }}
                      optionContainerStyle={{ borderWidth: 0 }}
                      selectStyle={{ borderWidth: 0 }}
                      selectTextStyle={{
                        textAlign: "left",
                        color: "blue",
                        fontWeight: "bold",
                      }}
                      initValueTextStyle={{
                        textAlign: "left",
                        color: "blue",
                        fontWeight: "bold",
                      }}
                      backdropPressToClose={true}
                      overlayStyle={{
                        flex: 1,
                        padding: "5%",
                        justifyContent: "center",
                        backgroundColor: "rgba(0,0,0,0)",
                      }}
                      optionContainerStyle={{
                        backgroundColor: "white",
                        borderRadius: 15,
                      }}
                      optionTextStyle={{ fontWeight: "bold" }}
                      sectionTextStyle={{ fontWeight: "bold" }}
                      cancelStyle={{
                        backgroundColor: "grey",
                        borderRadius: 15,
                      }}
                      cancelTextStyle={{ fontWeight: "bold", color: "white" }}
                      data={this.state.activityData}
                      initValue={this.state.activityPickerInitVal}
                      onChange={async (item) => {
                        this.selectedActivity = item.label;
                        this.isActivitySelected = true;
                        let newListByActivity = [];
                        let currentList = [];
                        if (!this.state.timeFilteredList) {
                          if (
                            this.state.monthCalCurrentMonth ===
                            this.state.date.getMonth()
                          ) {
                            currentList = this.combinedEventListThis;
                          } else if (
                            this.state.monthCalCurrentMonth ===
                            this.state.date.getMonth() - 1
                          ) {
                            currentList = this.combinedEventListLast;
                          } else {
                            currentList = this.combinedEventListNext;
                          }
                          this.setState({ eventFilteredList: true });
                        } else {
                          currentList = this.state.eventsThisMonth;
                          this.setState({ eventFilteredList: false });
                        }

                        let eventListDates = [];
                        for (let event of currentList) {
                          let dateNum = String(event.start.slice(8, 10));
                          if (!eventListDates.includes(dateNum)) {
                            eventListDates.push(dateNum);
                          }
                        }

                        let dayEventsList = [];
                        for (let dateNum of eventListDates) {
                          let dayEventObj = {
                            dateNum: parseInt(dateNum),
                            dayEvents: [],
                            isFiltered: false,
                          };
                          dayEventsList.push(dayEventObj);
                        }

                        for (let date of dayEventsList) {
                          for (let event of currentList) {
                            let dateNum = parseInt(event.start.slice(8, 10));
                            if (dateNum === date.dateNum) {
                              let newEvent = event;
                              date.dayEvents.push(newEvent);
                            }
                          }
                        }

                        let newEventList = [];

                        for (let date of dayEventsList) {
                          for (let event of date.dayEvents) {
                            if (event.title) {
                              if (event.title === item.label) {
                                date.isFiltered = true;
                              }
                            }
                          }
                        }

                        for (let date of dayEventsList) {
                          if (date.isFiltered) {
                            for (let event of date.dayEvents) {
                              newEventList.push(event);
                            }
                          }
                        }

                        // this.setState({activityPickerInitVal:"none"})

                        await this.setState({ eventsThisMonth: newEventList });

                        //this.monthCalRef.current.processEvents();
                      }}
                    />
                  </View>
                </View>
                <View
                  style={{
                    flex: 0.5,
                    flexDirection: "column",
                    height: "100%",
                    justifyContent: "space-between",
                    marginLeft: 5,
                  }}
                >
                  <View style={{ flex: 0.5, justifyContent: "center" }}>
                    <Text
                      style={{
                        margin: 5,
                        fontWeight: "bold",
                        textAlign: "center",
                        fontSize: 14,
                        color: "white",
                      }}
                    >
                      Add New Activity
                    </Text>
                  </View>
                  <View
                    style={{
                      flex: 0.5,
                      backgroundColor: "white",
                      height: "100%",
                      borderRadius: 20,
                      borderWidth: 2,
                      borderColor: "black",
                      marginRight: 0,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <TextInput
                      style={{ fontSize: 16, marginLeft: 10 }}
                      placeholder="add new activity"
                      value={this.state.userDefinedActivityText}
                      maxLength={35}
                      onChangeText={(text) =>
                        this.setState({ userDefinedActivityText: text })
                      }
                    ></TextInput>
                    <View>
                      <TouchableOpacity
                        onPress={async () => {
                          let activityList = this.state.activityData;
                          // console.log("activityList",activityList);
                          if (this.state.userDefinedActivityText === "") {
                            Alert.alert(
                              "Invalid Name",
                              "Activity name can't be empty",
                              [
                                {
                                  text: "OK",
                                  onPress: () => console.log("OK Pressed"),
                                },
                              ]
                            );
                            return;
                          }
                          this.index++;
                          let newActivity = {
                            key: this.index,
                            label: this.state.userDefinedActivityText,
                          };
                          for (let activity of activityList) {
                            let activityToLowerCase =
                              activity.label.toLowerCase();
                            let newActivityToLowerCase =
                              this.state.userDefinedActivityText.toLowerCase();
                            if (
                              activityToLowerCase === newActivityToLowerCase
                            ) {
                              Alert.alert(
                                this.state.userDefinedActivityText +
                                  " already existed",
                                "Please add another activity",
                                [
                                  {
                                    text: "OK",
                                    onPress: () => console.log("OK Pressed"),
                                  },
                                ]
                              );
                              this.setState({ userDefinedActivityText: "" });
                              return;
                            }
                          }
                          // console.log("newActivity",newActivity);
                          activityList.push(newActivity);
                          this.setState({ userDefinedActivityText: "" });
                          await this.dataModel.updateUserActivities(
                            this.userKey,
                            this.state.userDefinedActivityText
                          );
                        }}
                      >
                        <Ionicons
                          name="ios-add-circle"
                          size={30}
                          color={"black"}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            </View>
            <View
              style={{
                flex: 0.4,
                width: "90%",
                borderRadius: 20,
                flexDirection: "column",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: 20,
                backgroundColor: "#6E6E6E",
              }}
            >
              <View
                style={{
                  flex: 0.5,
                  flexDirection: "row",
                  width: "95%",
                  height: "100%",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingLeft: 10,
                  paddingRight: 10,
                  //backgroundColor:"red"
                }}
              >
                <View style={{ flex: 1, justifyContent: "center" }}>
                  <Text
                    style={{
                      margin: 5,
                      fontWeight: "bold",
                      textAlign: "center",
                      fontSize: 14,
                      color: "white",
                    }}
                  >
                    Start
                  </Text>
                </View>
                <View style={{ flex: 1, justifyContent: "center" }}>
                  <Text
                    style={{
                      margin: 5,
                      fontWeight: "bold",
                      textAlign: "center",
                      fontSize: 14,
                      color: "white",
                    }}
                  >
                    End
                  </Text>
                </View>
              </View>
              <View
                style={{
                  flex: 0.5,
                  flexDirection: "row",
                  width: "95%",
                  height: "90%",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingLeft: 10,
                  paddingRight: 10,
                  marginBottom: 10,

                  backgroundColor: "white",
                  borderRadius: 15,
                  // backgroundColor:"blue"
                }}
              >
                <View
                  style={{
                    flex: 1,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <DateTimePicker
                    value={this.state.timePickerDate}
                    mode="default"
                    is24Hour={true}
                    display="default"
                    onChange={async (e, date) => {
                      //let setDate = moment(date);
                      console.log("timePickerDate", date);
                      let startHour = moment(date).hour();
                      this.setState({ timePickerDate: date });
                      let newList = [];

                      if (startHour < 12) {
                        for (let event of this.state.eventsThisMonth) {
                          if (parseInt(event.start.slice(11, 13)) < 12) {
                            newList.push(event);
                          }
                        }
                      } else {
                        for (let event of this.state.eventsThisMonth) {
                          if (parseInt(event.start.slice(11, 13)) > 12) {
                            newList.push(event);
                          }
                        }
                      }
                      if (this.state.eventFilteredList) {
                        this.setState({ timeFilteredList: false });
                      } else {
                        this.setState({ timeFilteredList: true });
                      }

                      this.setState({ date: new Date() });
                      await this.setState({ eventsThisMonth: newList });

                      //this.monthCalRef.current.processEvents();
                    }}
                    style={{
                      width: "100%",
                      alignSelf: "center",
                      flexWrap: "wrap",
                      position: "absolute",
                      left: "25%",
                    }}
                  />
                </View>
                <View
                  style={{
                    flex: 1,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Text style={{ fontWeight: "bold", fontSize: 18 }}>
                    {moment(this.state.timePickerDate)
                      .add(30, "minutes")
                      .format("hh:mm")}
                  </Text>
                </View>
              </View>
            </View>
            <View
              style={{
                flex: 0.4,
                flexDirection: "row",
                width: "90%",
                //backgroundColor:"red",
                borderRadius: 20,
                justifyContent: "flex-end",
                marginTop: 20,
              }}
            >
              <TouchableOpacity
                disabled={false}
                onPress={() => this.onPlanBtnPressed()}
                style={{
                  flex: 0.3,
                  backgroundColor: "black",
                  color: "white",
                  width: 100,
                  height: 50,
                  borderRadius: 15,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "white", fontWeight: "bold" }}>Plan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SlidingUpPanel>
      </View>
    );
  }
}
