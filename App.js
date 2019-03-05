import React, {Component, Fragment}                                                                                 from "react"
import {Alert, Animated, AsyncStorage, Image, ImageBackground, StyleSheet, Text, TextInput, TouchableOpacity, View} from "react-native"
import BackgroundGeolocation                                                                                        from "react-native-mauron85-background-geolocation"
import {RNSlidingButton, SlideDirection}                                                                            from "rn-sliding-button"
import API                                                                                                          from "./api"

const bg = require("./images/bg.jpg")

const sleep = (ms = 1000) => new Promise(resolve => {
  setTimeout(resolve, ms)
})

class Tracking extends Component {
  state = {
    trackingAnimation: new Animated.Value(0),
    blinkingAnimation: new Animated.Value(1),
    tracking: false,
    autocomplete: false,
    currentRideId: null,
    user: null,
    email: "",
    password: "",
  }
  
  async componentDidMount() {
    await this.getUser()
    
    BackgroundGeolocation.configure({
                                      desiredAccuracy: BackgroundGeolocation.HIGH_ACCURACY,
                                      stationaryRadius: 50,
                                      distanceFilter: 50,
                                      debug: false,
                                      startOnBoot: false,
                                      stopOnTerminate: false,
                                      locationProvider: BackgroundGeolocation.ACTIVITY_PROVIDER,
                                      interval: 10000,
                                      fastestInterval: 5000,
                                      activitiesInterval: 10000,
                                      stopOnStillActivity: false,
                                    })
    
    BackgroundGeolocation.on("location", location => {
      console.log("Location: ", location)
      console.log(location)
      
      API.update(this.state.currentRideId, {
        longitude: location.longitude,
        latitude: location.latitude,
      })
    })
    
    BackgroundGeolocation.on("error", (error) => {
      console.log("[ERROR] BackgroundGeolocation error:", error)
    })
    
    BackgroundGeolocation.on("start", () => {
      console.log("[INFO] BackgroundGeolocation service has been started")
    })
    
    BackgroundGeolocation.on("stop", () => {
      console.log("[INFO] BackgroundGeolocation service has been stopped")
    })
    
    BackgroundGeolocation.on("authorization", (status) => {
      if (status !== BackgroundGeolocation.AUTHORIZED) {
        setTimeout(() => Alert.alert(
            "App requires location tracking permission",
            "Would you like to open app settings?",
            [
              {
                text: "Yes",
                onPress: () => BackgroundGeolocation.showAppSettings(),
              },
              {
                text: "No",
                onPress: () => alert(`You won't be able to use this app`),
                style: "cancel",
              },
            ],
        ), 1000)
      }
    })
    
    BackgroundGeolocation.on("background", () => {
      console.log("[INFO] App is in background")
    })
    
    BackgroundGeolocation.on("foreground", () => {
      console.log("[INFO] App is in foreground")
    })
    
    BackgroundGeolocation.checkStatus(status => {
      console.log("[INFO] BackgroundGeolocation service is running", status.isRunning)
      console.log("[INFO] BackgroundGeolocation auth status: " + status.authorization)
      
      console.log(
          "[INFO] BackgroundGeolocation services enabled",
          status.locationServicesEnabled,
      )
    })
  }
  
  componentWillUnmount() {
    BackgroundGeolocation.events.forEach(event => (
        BackgroundGeolocation.removeAllListeners(event)
    ))
  }
  
  getUser = async () => {
    let {user} = this.state
    if (user === null) {
      try {
        let u = await AsyncStorage.getItem("user") || null
        if (u !== null) this.setState({user: JSON.parse(u)})
      } catch (e) {
        console.log("err", e)
      }
    } else return user
  }
  startTrackingAnimation = () => {
    Animated.timing(this.state.trackingAnimation, {
      toValue: 48,
      duration: 500,
    }).start()
  }
  
  disableTrackingAnimation = () => {
    Animated.timing(this.state.trackingAnimation, {
      toValue: 0,
      duration: 200,
    }).start()
  }
  
  startBlinkAnimation = () => {
    Animated.sequence([
                        Animated.timing(this.state.blinkingAnimation, {
                          toValue: 1,
                          duration: 600,
                        }),
                        Animated.timing(this.state.blinkingAnimation, {
                          toValue: 0.7,
                          duration: 600,
                        }),
                      ]).start(event => {
      if (event.finished) this.startBlinkAnimation()
    })
  }
  
  showAutoComplete = () => this.setState({autocomplete: true})
  
  hideAutoComplete = () => this.setState({autocomplete: false})
  
  activateTracker = async (_, location) => {
    const {user} = this.state
    navigator.geolocation.getCurrentPosition(async currentLocation => {
      const startPoint = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      }
      
      // const { location: destination } = location.geometry;
      // const { formatted_address } = location;
      
      const data = await API.create(startPoint, user)
      // const parsedData = await data.json()
      
      this.setState({currentRideId: data})
    })
    
    this.startTrackingAnimation()
    this.startBlinkAnimation()
    // this.hideAutoComplete()
    this.setState({tracking: true})
    
    await sleep(2000)
    
    BackgroundGeolocation.start()
  }
  
  disabledTracker = () => {
    this.disableTrackingAnimation()
    
    API.complete(this.state.currentRideId)
    BackgroundGeolocation.stop()
    
    this.setState({tracking: false})
  }
  
  login = async () => {
    const {email, password} = this.state
    const user = await API.login(email, password)
    if (user.uid) {
      try {
        await AsyncStorage.setItem("user",JSON.stringify(user))
      } catch (e) {
        Alert.alert("Erreur", e.message)
      }
      this.setState({user})
    } else Alert.alert("Erreur", user.message)
  }
  
  render() {
    const {
      trackingAnimation,
      blinkingAnimation,
      tracking,
      user,
    } = this.state
    
    return (
        <ImageBackground source={bg} style={styles.wrapper}>
          {!!!user && <View style={styles.autocomplete}>
            <TextInput placeholder="E-mail" style={autocompleteStyles.textInput} keyboardType="email-address" returnKeyLabel='Suivant' returnKeyType="next"
                       onChangeText={text => this.setState({email: text})}/>
            <TextInput placeholder="Mot de passe" style={autocompleteStyles.textInput} returnKeyLabel='Connexion' returnKeyType="done" onChangeText={text => this.setState({password: text})}
                       secureTextEntry/>
            <TouchableOpacity style={styles.button} onPress={_ => this.login()}>
              <Text style={styles.buttonText}>Connexion</Text>
            </TouchableOpacity></View>}
          {/*{ autocomplete && (*/}
          {/*<View style={styles.autocomplete}>*/}
          {/*<Text style={styles.cancel} onPress={this.hideAutoComplete}>*/}
          {/*Cancel*/}
          {/*</Text>*/}
          
          {/*<GooglePlacesAutocomplete*/}
          {/*placeholder='Enter Location'*/}
          {/*minLength={1}*/}
          {/*autoFocus={true}*/}
          {/*fetchDetails={true}*/}
          {/*query={{ key: GOOGLE_MAPS_API }}*/}
          {/*styles={autocompleteStyles}*/}
          {/*currentLocation={false}*/}
          {/*onPress={this.activateTracker}*/}
          {/*/>*/}
          {/*</View>*/}
          {/*)}*/}
          
          <Animated.View style={[styles.tracking, {
            height: trackingAnimation,
            opacity: blinkingAnimation,
          }]}>
            <Text style={styles.trackingText}>
              En route
            </Text>
          </Animated.View>
          
          <View style={styles.logoWrapper}>
            <Image
                source={require("./images/WOULE-logo.png")}
                style={styles.logo}
            />
          </View>
          
          {tracking ? (
              <Fragment>
                <View style={styles.disableWrapper}>
                  <Text style={styles.disableText}>STOP</Text>
                  
                  <RNSlidingButton
                      style={styles.slider}
                      height={50}
                      onSlidingSuccess={this.disabledTracker}
                      slideDirection={SlideDirection.RIGHT}
                      successfulSlidePercent={80}
                  >
                    <View style={styles.thumb}/>
                  </RNSlidingButton>
                </View>
              </Fragment>
          ) : (
               <View style={styles.buttonWrapper}>
                 <TouchableOpacity
                     activeOpacity={.7}
                     style={styles.button}
                     onPress={this.activateTracker}
                 >
                   <Text style={styles.buttonText}>WOULÉ !</Text>
                 </TouchableOpacity>
               </View>
           )}
        </ImageBackground>
    )
  }
}

const styles = StyleSheet.create({
                                   wrapper: {
                                     width: "100%",
                                     height: "100%",
                                   },
                                   logoWrapper: {
                                     flex: 1,
                                     justifyContent: "flex-start",
                                     marginTop: 70,
                                     alignItems: "center",
                                   },
                                   logo: {
                                     height: 100,
                                     resizeMode: "contain",
                                   },
                                   buttonWrapper: {
                                     flex: 1,
                                     justifyContent: "flex-end",
                                     marginBottom: 40,
                                     alignItems: "center",
                                   },
                                   button: {
                                     width: "60%",
                                     padding: 15,
                                     backgroundColor: "white",
                                     borderRadius: 5,
                                   },
                                   buttonText: {
                                     fontSize: 16,
                                     fontWeight: "100",
                                     textAlign: "center",
                                     color: "#737b00",
                                   },
                                   tracking: {
                                     position: "absolute",
                                     top: 0,
                                     left: 0,
                                     width: "100%",
                                     height: 45,
                                     backgroundColor: "#3ba033",
                                     alignItems: "center",
                                   },
                                   trackingText: {
                                     color: "white",
                                     marginTop: 24,
                                     fontSize: 12,
                                   },
                                   disableWrapper: {
                                     position: "absolute",
                                     bottom: 40,
                                     width: "100%",
                                     alignItems: "center",
                                   },
                                   disableText: {
                                     color: "white",
                                     marginBottom: 10,
                                     fontSize: 12,
                                     opacity: 0.7,
                                   },
                                   slider: {
                                     width: "60%",
                                     alignSelf: "center",
                                     borderRadius: 40,
                                     padding: 5,
                                     backgroundColor: "white",
                                   },
                                   thumb: {
                                     backgroundColor: "#a83f3f",
                                     height: 40,
                                     width: 40,
                                     borderRadius: 20,
                                   },
                                   autocomplete: {
                                     flex: 1,
                                     width: "100%",
                                     height: "100%",
                                     position: "absolute",
                                     padding: 10,
                                     paddingTop: 30,
                                     backgroundColor: "rgba(0, 0, 0, .8)",
                                     zIndex: 1,
                                     elevation: 100,
                                   },
                                   cancel: {
                                     color: "#d65252",
                                     alignSelf: "flex-end",
                                     fontSize: 12,
                                     padding: 5,
                                     borderRadius: 5,
                                   },
                                 })

const autocompleteStyles = {
  container: {
    height: "40%",
  },
  textInputContainer: {
    backgroundColor: "rgba(0,0,0,0)",
    borderTopWidth: 0,
    borderBottomWidth: 0,
  },
  textInput: {
    marginLeft: 0,
    marginRight: 0,
    marginVertical: 8,
    height: 50,
    color: "#5d5d5d",
    backgroundColor: "white",
    fontSize: 26,
    fontWeight: "300",
  },
  predefinedPlacesDescription: {
    color: "#1faadb",
  },
  listView: {
    backgroundColor: "whitesmoke",
    top: 70,
    minHeight: 50,
    width: "100%",
    paddingTop: 5,
    paddingRight: 20,
    borderRadius: 5,
    position: "absolute",
  },
  poweredContainer: {
    justifyContent: "center",
    backgroundColor: "whitesmoke",
  },
}

export default Tracking