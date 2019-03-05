import 'firebase/firestore'
// Initialize Firebase
const config = {
	apiKey: "",
	authDomain: "",
	databaseURL: "",
	projectId: "",
	storageBucket: "",
	messagingSenderId: ""
}

firebase.initializeApp(config)

export default firebase
export const db = firebase.firestore()

export const auth = firebase.auth()
export const GOOGLE_MAPS_API = 'AIzaSyDCzUoYzRzojxa1sbtHuPrw2zMwBiOo81I';