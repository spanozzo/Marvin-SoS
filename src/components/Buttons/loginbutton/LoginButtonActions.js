import UniversityContract from '../../../../build/contracts/UserLogic.json'
import {
    browserHistory
} from 'react-router'
import store from '../../../store'
import * as utils from '../../../util/util'

const contract = require('truffle-contract')

const IPFS = require('ipfs-mini')

var ipfs = new IPFS({
    host: "ipfs.infura.io",
    port: '5001',
    protocol: 'https'
})

// function putJSON(jsonPARAM) {
//   return new Promise(function (resolve, reject) {
//       ipfs.addJSON(jsonPARAM, function (err, data) {
//           if(err !== null) return reject(err);
//           resolve(data);
//       })
//   })
// }

function getJSON(hashIpfsPARAM) {
  return new Promise(function (resolve, reject) {
      ipfs.catJSON(hashIpfsPARAM, function (err, data) {
          if(err !== null) return reject(err);
          resolve(data);
      })
  })
}




export const USER_LOGGED_IN = 'USER_LOGGED_IN'
//function userLoggedIn(user) {
function userLoggedIn(payload) {
    return {
        type: USER_LOGGED_IN,
        //payload: user
        payload: payload
    }
}

export function loginUser() {
    let web3 = store.getState()
        .web3.web3Instance

    var payload = {
        name: '',
        surname: '',
        email: '',
        FC: '',
        tp: '',
        badgeNumber: ''
    }

    // Double-check web3's status.
    if(typeof web3 !== 'undefined') {

        return function (dispatch) {
            // Using truffle-contract we create the authentication object.
            const university = contract(UniversityContract)
            university.setProvider(web3.currentProvider)

            // Declaring this for later so we can chain functions on Authentication.
            var universityInstance

            // Get current ethereum wallet.
            web3.eth.getCoinbase((error, coinbase) => {
                // Log errors, if any.
                if(error) {
                    console.error(error);
                }

                university.deployed()
                    .then(function (instance) {
                        universityInstance = instance

                        // Attempt to login user.
                        universityInstance.login({
                                from: coinbase
                            })
                            .then(result => {
                                // If no error, login user.
                                //let [nam,surnam] = result.call(2);
                                //var nm = web3.toUtf8(nam);
                                //var srnm = web3.toUtf(surnam);

                                payload.FC = web3.toUtf8(result[0]);
                                payload.tp = web3.toDecimal(result[1]);
                                payload.badgeNumber = web3.toDecimal(result[2]);
                                
                                console.log("result[3]:", web3.toUtf8(result[3]))
                                
                                //result[3] is our new hashIPFS from where we want to retrieve the user infos
                                if(payload.tp!== 4) {
                                    getJSON(web3.toUtf8(result[3]))
                                        .then(jFile => {
                                            console.log("jFile:", jFile)
                                            payload.name = jFile.name;
                                            payload.surname = jFile.surname;
                                            payload.email = jFile.email;
                                        })
                                        .catch(err => {
                                            console.log('Fail:', err)
                                        })
                                    }


                                // putJSON(obj)
                                //     .then((hash) => {
                                //         console.log('my id is: ', hash)

                                //         getJSON(hash)
                                //             .then(j => {
                                //                 console.log(JSON.stringify(j))
                                //             })
                                //             .catch((err) => {
                                //                 console.log('Fail: ', err)
                                //             })
                                //     })
                                //     .catch((err) => {
                                //         console.log('Fail: ', err)
                                //     })

                                // })
                                //var userName = web3.utils.toUtf8(result)

                                //dispatch(userLoggedIn({"name": userName}))
                                dispatch(userLoggedIn({
                                    payload
                                }))

                                // Used a manual redirect here as opposed to a wrapper.
                                // This way, once logged in a user can still access the home page.
                                // var currentLocation = browserHistory.getCurrentLocation()

                                var currentLocation = browserHistory.getCurrentLocation()

                                if('redirect' in currentLocation.query) {
                                    return browserHistory.push(decodeURIComponent(currentLocation.query.redirect))
                                }

                                return browserHistory.push('/profile') | alert(payload.FC + " successfully logged in as " + utils.userDef(payload.tp) + " with badge number: " + payload.badgeNumber)
                            })
                            .catch(function (result) {
                                // If error, go to signup page.
                                console.error('Wallet ' + coinbase + ' does not have an account!')

                                return browserHistory.push('/signup')
                            })
                    })
            })
        }
    } else {
        console.error('Web3 is not initialized.');
    }
}