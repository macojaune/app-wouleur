import firebase, {auth, db} from "./config"

class API {
	static login(email, pass) {
		return auth.signInWithEmailAndPassword(email.trim(), pass.trim())
		           .then(({user}) => user)
		           .catch(err => err)
	}
	
	static create(startPoint, user) {
		return db.collection("wouleurs").doc(user.uid).collection("rides").add({started_at: firebase.firestore.Timestamp.now()})
		         .then(rideRef => {
			         let loc = rideRef.collection("locations").add({start: true, coords: new firebase.firestore.GeoPoint(startPoint.latitude, startPoint.longitude)})
			         return rideRef
		         })
	}
	
	static update(rideRef, location) {
		let loc = {coords: new firebase.firestore.GeoPoint(location.latitude, location.longitude), datetime: firebase.firestore.Timestamp.now()}
		return rideRef.collection("locations").add(loc)
	}
	
	static complete(rideRef) {
		return rideRef.update({stopped_at:  firebase.firestore.Timestamp.now()})
	}
	// static baseURL = "http://192.168.2.52:3001"
	//
	// static endpoints = {
	// 	create: "ride",
	// 	update: "ride/{id}",
	// 	complete: "ride/{id}/complete",
	// }
	//
	// static headers = {
	// 	Accept: "application/json",
	// 	"Content-Type": "application/json",
	// }
	//
	// static create(name, startPoint, destination) {
	// 	const url = `${this.baseURL}/${this.endpoints.create}`
	// 	const body = new FormData()
	//
	// 	return fetch(url, {
	// 		method: "POST",
	// 		headers: this.headers,
	// 		body: JSON.stringify({
	// 			                     name,
	// 			                     startPoint,
	// 			                     destination: {
	// 				                     latitude: destination.lat,
	// 				                     longitude: destination.lng,
	// 			                     },
	// 		                     }),
	// 	})
	// }
	//
	// static update(id, location) {
	// 	const endpoint = this.endpoints.update.replace("{id}", id)
	// 	const url = `${this.baseURL}/${endpoint}`
	//
	// 	return fetch(url, {
	// 		method: "PUT",
	// 		headers: this.headers,
	// 		body: JSON.stringify({location}),
	// 	})
	// }
	//
	//
	// static complete(id) {
	// 	const endpoint = this.endpoints.complete.replace("{id}", id)
	// 	const url = `${this.baseURL}/${endpoint}`
	//
	// 	return fetch(url, {
	// 		method: "POST",
	// 		headers: this.headers,
	// 	})
	// }
	//
}

export default API