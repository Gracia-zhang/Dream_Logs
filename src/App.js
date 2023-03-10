import "./styles.css";
import { useState, useEffect } from "react";
import ReactCSSTransitionGroup from "react-addons-css-transition-group";
import {
  Element,
  animateScroll as scroll,
  scrollSpy,
  scroller
} from "react-scroll";

const SpeechRecognition = window.SpeechRecognition || webkitSpeechRecognition;

export default function App() {
  let [valueArray, setValue] = useState(() => {
    // getting stored value
    const saved = localStorage.getItem("myDream");
    const initialValue = JSON.parse(saved);
    console.log(initialValue);
    return initialValue || [];
  });
  let [recognitionText, setRecognitionText] = useState("");
  let [interimText, setInterimText] = useState("");
  let [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    elapsedTimeTag = document.getElementsByClassName("elapsed-time")[0];
    audioElement = document.getElementsByClassName("audio-element")[0];
    audioElementSource = document
      .getElementsByClassName("audio-element")[0]
      .getElementsByTagName("source")[0];
    textIndicatorOfAudiPlaying = document.getElementsByClassName(
      "text-indication-of-audio-playing"
    )[0];
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onresult = function (event) {
      let result = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          setRecognitionText(
            (current) => current + event.results[i][0].transcript
          );
        } else {
          result += event.results[i][0].transcript;
        }
      }

      setInterimText(result);
    };
  });

  return (
    <div className="App">
      <div id="top">
        <div id="filter"></div>
        <h1 id="title">Dream Logs</h1>
        <img
          id="account"
          src={require("../assets/account.png")}
          alt="account"
        />
      </div>

      <div id="mainBody">
        <div
          className="Comment"
          style={{ display: isRecording ? "flex" : "none", height: "90%" }}
        >
          <div className="Content">
            <div className="Comment-text">{recognitionText + interimText}</div>
          </div>
        </div>
        {/* {JSON.stringify(valueArray)} */}
        <Element
          className="example"
          style={{ height: "100%", overflowX: "hidden" }}
        >
          <ReactCSSTransitionGroup
            transitionName="cards"
            transitionAppear={true}
            transitionAppearTimeout={500}
            transitionEnterTimeout={500}
            transitionLeaveTimeout={300}
          >
            {valueArray.map((a_comment, i) => {
              return <Comment key={i} comment={a_comment} />;
            })}
          </ReactCSSTransitionGroup>
        </Element>
        <div
          id="cover"
          style={{
            backgroundImage: isRecording
              ? "linear-gradient(rgba(0, 0, 0, 0), #ffffff 60%)"
              : "linear-gradient(rgba(170, 177, 240, 0), #aab1f0 60%)"
          }}
        ></div>

        <button
          id="addDream"
          className="addDream"
          style={{ display: isRecording ? "none" : "initial" }}
          onClick={() => {
            startAudioRecording(setIsRecording);
            //  valueArray.push(comments[Math.floor(Math.random() * 4, 1)]);
            //  setValue(valueArray.slice(0));
          }}
        >
          {"+"}
        </button>
        <div
          className="recording-contorl-buttons-container"
          style={{ display: isRecording ? "flex" : "none" }}
        >
          <img
            className="cancel-recording-button fa fa-times-circle-o"
            aria-hidden="true"
            src={require("../assets/cancel.png")}
            alt="cancel"
            onClick={() => {
              cancelAudioRecording(
                setIsRecording,
                setInterimText,
                setRecognitionText
              );
            }}
          />
          <div>
            <div className="recording-elapsed-time">
              <img
                className="red-recording-dot fa fa-circle"
                aria-hidden="true"
                src={require("../assets/dot.png")}
                alt="dot"
              />
              <p className="elapsed-time"></p>
            </div>
            <img
              className="stop-recording-button fa fa-stop-circle-o"
              aria-hidden="true"
              src={require("../assets/stop.png")}
              alt="stop"
              onClick={() => {
                valueArray.splice(0, 0, {
                  date: new Date(),
                  text: recognitionText + interimText
                });
                setValue(valueArray.slice(0));
                console.log(JSON.stringify(valueArray));
                localStorage.setItem("myDream", JSON.stringify(valueArray));
                stopAudioRecording(
                  setIsRecording,
                  setInterimText,
                  setRecognitionText
                );
              }}
            />
          </div>
          <div style={{ width: "6vh", height: "6vh" }}></div>
        </div>
      </div>

      <audio controls className="audio-element hide"></audio>
    </div>
  );
}

function Comment(props) {
  return (
    <div className="Comment">
      <div className="Content">
        <div className="Comment-date">{formatDate(props.comment.date)}</div>
        <div className="Comment-text">{props.comment.text}</div>
      </div>
    </div>
  );
}

function formatDate(date) {
  console.log(date);
  const date1 = new Date(date);
  if (!date?.toLocaleDateString) {
    return date1.toLocaleDateString();
  }
  return date.toLocaleDateString();
}

//recording
// index.js ---------------
//Model
//none
var elapsedTimeTag;
var audioElement;
var audioElementSource;
var textIndicatorOfAudiPlaying;
const recognition = new SpeechRecognition();

/** Creates a source element for the the audio element in the HTML document*/
function createSourceForAudioElement() {
  let sourceElement = document.createElement("source");
  audioElement.appendChild(sourceElement);

  audioElementSource = sourceElement;
}

/** Display the text indicator of the audio being playing in the background */
function displayTextIndicatorOfAudioPlaying() {
  textIndicatorOfAudiPlaying.classList.remove("hide");
}

/** Hide the text indicator of the audio being playing in the background */
function hideTextIndicatorOfAudioPlaying() {
  textIndicatorOfAudiPlaying.classList.add("hide");
}

//Controller

/** Stores the actual start time when an audio recording begins to take place to ensure elapsed time start time is accurate*/
var audioRecordStartTime;

/** Stores the maximum recording time in hours to stop recording once maximum recording hour has been reached */
var maximumRecordingTimeInHours = 1;

/** Stores the reference of the setInterval function that controls the timer in audio recording*/
var elapsedTimeTimer;

/** Starts the audio recording*/
function startAudioRecording(setIsRecording) {
  console.log("Recording Audio...");

  //If a previous audio recording is playing, pause it
  let recorderAudioIsPlaying = !audioElement.paused; // the paused property tells whether the media element is paused or not
  console.log("paused?", !recorderAudioIsPlaying);
  recognition.start();
  if (recorderAudioIsPlaying) {
    audioElement.pause();
    //also hide the audio playing indicator displayed on the screen
    hideTextIndicatorOfAudioPlaying();
  }

  //start recording using the audio recording API
  audioRecorder
    .start()
    .then(() => {
      //on success

      //store the recording start time to display the elapsed time according to it
      audioRecordStartTime = new Date();

      //display control buttons to offer the functionality of stop and cancel
      setIsRecording(true);
      handleElapsedRecordingTime();
    })
    .catch((error) => {
      //on error
      console.log("error!");
    });
}
/** Stop the currently started audio recording & sends it
 */
function stopAudioRecording(
  setIsRecording,
  setInterimText,
  setRecognitionText
) {
  console.log("Stopping Audio Recording...");
  recognition.stop();
  //stop the recording using the audio recording API
  audioRecorder
    .stop()
    .then((audioAsblob) => {
      //Play recorder audio
      //playAudio(audioAsblob);

      //hide recording control button & return record icon
      setIsRecording(false);
      setInterimText("");
      setRecognitionText("");
    })
    .catch((error) => {
      //Error handling structure
      switch (error.name) {
        case "InvalidStateError": //error from the MediaRecorder.stop
          console.log("An InvalidStateError has occured.");
          break;
        default:
          console.log("An error occured with the error name " + error.name);
      }
    });
}

/** Cancel the currently started audio recording */
function cancelAudioRecording(
  setIsRecording,
  setInterimText,
  setRecognitionText
) {
  console.log("Canceling audio...");

  //cancel the recording using the audio recording API
  audioRecorder.cancel();
  recognition.stop();
  //hide recording control button & return record icon
  setIsRecording(false);
  setInterimText("");
  setRecognitionText("");
}

/** Plays recorded audio using the audio element in the HTML document
 * @param {Blob} recorderAudioAsBlob - recorded audio as a Blob Object
 */
function playAudio(recorderAudioAsBlob) {
  //read content of files (Blobs) asynchronously
  let reader = new FileReader();

  //once content has been read
  reader.onload = (e) => {
    //store the base64 URL that represents the URL of the recording audio
    let base64URL = e.target.result;

    //If this is the first audio playing, create a source element
    //as pre populating the HTML with a source of empty src causes error
    if (!audioElementSource)
      //if its not defined create it (happens first time only)
      createSourceForAudioElement();

    //set the audio element's source using the base64 URL
    audioElementSource.src = base64URL;

    //set the type of the audio element based on the recorded audio's Blob type
    let BlobType = recorderAudioAsBlob.type.includes(";")
      ? recorderAudioAsBlob.type.substr(
          0,
          recorderAudioAsBlob.type.indexOf(";")
        )
      : recorderAudioAsBlob.type;
    audioElementSource.type = BlobType;

    //call the load method as it is used to update the audio element after changing the source or other settings
    audioElement.load();

    //play the audio after successfully setting new src and type that corresponds to the recorded audio
    console.log("Playing audio...");
    audioElement.play();

    //Display text indicator of having the audio play in the background
    displayTextIndicatorOfAudioPlaying();
  };

  //read content and convert it to a URL (base64)
  reader.readAsDataURL(recorderAudioAsBlob);
}

/** Computes the elapsed recording time since the moment the function is called in the format h:m:s*/
function handleElapsedRecordingTime() {
  //display inital time when recording begins
  displayElapsedTimeDuringAudioRecording("00:00");

  //create an interval that compute & displays elapsed time, as well as, animate red dot - every second
  elapsedTimeTimer = setInterval(() => {
    //compute the elapsed time every second
    let elapsedTime = computeElapsedTime(audioRecordStartTime); //pass the actual record start time
    //display the elapsed time
    displayElapsedTimeDuringAudioRecording(elapsedTime);
  }, 1000); //every second
}

/** Display elapsed time during audio recording
 * @param {String} elapsedTime - elapsed time in the format mm:ss or hh:mm:ss
 */
function displayElapsedTimeDuringAudioRecording(elapsedTime) {
  //1. display the passed elapsed time as the elapsed time in the elapsedTime HTML element
  elapsedTimeTag.innerHTML = elapsedTime;

  //2. Stop the recording when the max number of hours is reached
  if (elapsedTimeReachedMaximumNumberOfHours(elapsedTime)) {
    stopAudioRecording();
  }
}

/**
 * @param {String} elapsedTime - elapsed time in the format mm:ss or hh:mm:ss
 * @returns {Boolean} whether the elapsed time reached the maximum number of hours or not
 */
function elapsedTimeReachedMaximumNumberOfHours(elapsedTime) {
  //Split the elapsed time by the symbo :
  let elapsedTimeSplitted = elapsedTime.split(":");

  //Turn the maximum recording time in hours to a string and pad it with zero if less than 10
  let maximumRecordingTimeInHoursAsString =
    maximumRecordingTimeInHours < 10
      ? "0" + maximumRecordingTimeInHours
      : maximumRecordingTimeInHours.toString();

  //if it the elapsed time reach hours and also reach the maximum recording time in hours return true
  if (
    elapsedTimeSplitted.length === 3 &&
    elapsedTimeSplitted[0] === maximumRecordingTimeInHoursAsString
  )
    return true;
  //otherwise, return false
  else return false;
}

/** Computes the elapsedTime since the moment the function is called in the format mm:ss or hh:mm:ss
 * @param {String} startTime - start time to compute the elapsed time since
 * @returns {String} elapsed time in mm:ss format or hh:mm:ss format, if elapsed hours are 0.
 */
function computeElapsedTime(startTime) {
  //record end time
  let endTime = new Date();

  //time difference in ms
  let timeDiff = endTime - startTime;

  //convert time difference from ms to seconds
  timeDiff = timeDiff / 1000;

  //extract integer seconds that dont form a minute using %
  let seconds = Math.floor(timeDiff % 60); //ignoring uncomplete seconds (floor)

  //pad seconds with a zero if neccessary
  seconds = seconds < 10 ? "0" + seconds : seconds;

  //convert time difference from seconds to minutes using %
  timeDiff = Math.floor(timeDiff / 60);

  //extract integer minutes that don't form an hour using %
  let minutes = timeDiff % 60; //no need to floor possible incomplete minutes, becase they've been handled as seconds
  minutes = minutes < 10 ? "0" + minutes : minutes;

  //convert time difference from minutes to hours
  timeDiff = Math.floor(timeDiff / 60);

  //extract integer hours that don't form a day using %
  let hours = timeDiff % 24; //no need to floor possible incomplete hours, becase they've been handled as seconds

  //convert time difference from hours to days
  timeDiff = Math.floor(timeDiff / 24);

  // the rest of timeDiff is number of days
  let days = timeDiff; //add days to hours

  let totalHours = hours + days * 24;
  totalHours = totalHours < 10 ? "0" + totalHours : totalHours;

  if (totalHours === "00") {
    return minutes + ":" + seconds;
  } else {
    return totalHours + ":" + minutes + ":" + seconds;
  }
}

// audio-recording.js ---------------
//API to handle audio recording

var audioRecorder = {
  /** Stores the recorded audio as Blob objects of audio data as the recording continues*/
  audioBlobs: [] /*of type Blob[]*/,
  /** Stores the reference of the MediaRecorder instance that handles the MediaStream when recording starts*/
  mediaRecorder: null /*of type MediaRecorder*/,
  /** Stores the reference to the stream currently capturing the audio*/
  streamBeingCaptured: null /*of type MediaStream*/,
  /** Start recording the audio
   * @returns {Promise} - returns a promise that resolves if audio recording successfully started
   */
  start: function () {
    //Feature Detection
    if (!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) {
      //Feature is not supported in browser
      //return a custom error
      return Promise.reject(
        new Error(
          "mediaDevices API or getUserMedia method is not supported in this browser."
        )
      );
    } else {
      //Feature is supported in browser

      //create an audio stream
      return (
        navigator.mediaDevices
          .getUserMedia({ audio: true } /*of type MediaStreamConstraints*/)
          //returns a promise that resolves to the audio stream
          .then((stream) /*of type MediaStream*/ => {
            //save the reference of the stream to be able to stop it when necessary
            audioRecorder.streamBeingCaptured = stream;

            //create a media recorder instance by passing that stream into the MediaRecorder constructor
            audioRecorder.mediaRecorder = new MediaRecorder(
              stream
            ); /*the MediaRecorder interface of the MediaStream Recording
                    API provides functionality to easily record media*/

            //clear previously saved audio Blobs, if any
            audioRecorder.audioBlobs = [];

            //add a dataavailable event listener in order to store the audio data Blobs when recording
            audioRecorder.mediaRecorder.addEventListener(
              "dataavailable",
              (event) => {
                //store audio Blob object
                audioRecorder.audioBlobs.push(event.data);
              }
            );

            //start the recording by calling the start method on the media recorder
            audioRecorder.mediaRecorder.start();
          })
      );

      /* errors are not handled in the API because if its handled and the promise is chained, the .then after the catch will be executed*/
    }
  },
  /** Stop the started audio recording
   * @returns {Promise} - returns a promise that resolves to the audio as a blob file
   */
  stop: function () {
    //return a promise that would return the blob or URL of the recording
    return new Promise((resolve) => {
      //save audio type to pass to set the Blob type
      let mimeType = audioRecorder.mediaRecorder.mimeType;

      //listen to the stop event in order to create & return a single Blob object
      audioRecorder.mediaRecorder.addEventListener("stop", () => {
        //create a single blob object, as we might have gathered a few Blob objects that needs to be joined as one
        let audioBlob = new Blob(audioRecorder.audioBlobs, { type: mimeType });

        //resolve promise with the single audio blob representing the recorded audio
        resolve(audioBlob);
      });
      audioRecorder.cancel();
    });
  },
  /** Cancel audio recording*/
  cancel: function () {
    //stop the recording feature
    audioRecorder.mediaRecorder.stop();

    //stop all the tracks on the active stream in order to stop the stream
    audioRecorder.stopStream();

    //reset API properties for next recording
    audioRecorder.resetRecordingProperties();
  },
  /** Stop all the tracks on the active stream in order to stop the stream and remove
   * the red flashing dot showing in the tab
   */
  stopStream: function () {
    //stopping the capturing request by stopping all the tracks on the active stream
    audioRecorder.streamBeingCaptured
      .getTracks() //get all tracks from the stream
      .forEach((track) /*of type MediaStreamTrack*/ => track.stop()); //stop each one
  },
  /** Reset all the recording properties including the media recorder and stream being captured*/
  resetRecordingProperties: function () {
    audioRecorder.mediaRecorder = null;
    audioRecorder.streamBeingCaptured = null;

    /*No need to remove event listeners attached to mediaRecorder as
        If a DOM element which is removed is reference-free (no references pointing to it), the element itself is picked
        up by the garbage collector as well as any event handlers/listeners associated with it.
        getEventListeners(audioRecorder.mediaRecorder) will return an empty array of events.*/
  }
};
