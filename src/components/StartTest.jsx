import React, { useCallback, useEffect, useState } from "react";
import { Prompt } from "react-router-dom";
import Webcam from "react-webcam";
import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import Calculator from "awesome-react-calculator";
import IconButton from "@material-ui/core/IconButton";
import Pagination from "@material-ui/lab/Pagination";

import { postRequest } from "../utils/serviceCall";
import { Timer } from "./Timer.jsx";
import { MultipleChoiceQuestion } from "./MultipleChoiceQuestion.jsx";
import calculatorLogo from "../images/keys.png";

import "../styles/test.css";

const videoConstraints = {
  facingMode: "user",
};

const StartTest = (props) => {
  const {
    handleUserViolation,
    examDetail,
    questions,
    answer,
    answerMCQ,
    timeElapsed,
  } = props;
  const [timeLeft, setTimeLeft] = useState(
    examDetail.duration * 60 - timeElapsed
  );
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [isPageVisible, setIsPageVisible] = useState(true);
  const [awayTimer, setAwayTimer] = useState(0);

  const handleChange = (_event, value) => {
    setCurrentQuestion(value - 1);
  };

  useEffect(() => {
    const elapseTimer = setInterval(() => {
      postRequest("api/exam/attempt", { examId: examDetail.id });
    }, 2000);
    return () => clearInterval(elapseTimer);
  }, [examDetail.id, isPageVisible]);

  useEffect(() => {
    if (!isPageVisible) {
      const awayTimerInterval = setInterval(
        () => setAwayTimer((awayTimer) => awayTimer + 1),
        1000
      );
      return () => clearInterval(awayTimerInterval);
    } else {
      if (awayTimer > 0) {
        setAwayTimer(0);
      }
    }
  }, [awayTimer, isPageVisible]);

  useEffect(() => {
    let browserPrefixes = ["moz", "ms", "o", "webkit"];

    // get the correct attribute name
    function getHiddenPropertyName(prefix) {
      return prefix ? prefix + "Hidden" : "hidden";
    }

    // get the correct event name
    function getVisibilityEvent(prefix) {
      return (prefix ? prefix : "") + "visibilitychange";
    }

    // get current browser vendor prefix
    function getBrowserPrefix() {
      for (let i = 0; i < browserPrefixes.length; i++) {
        if (getHiddenPropertyName(browserPrefixes[i]) in document) {
          // return vendor prefix
          return browserPrefixes[i];
        }
      }
      // no vendor prefix needed
      return null;
    }

    // bind and handle events
    let browserPrefix = getBrowserPrefix(),
      hiddenPropertyName = getHiddenPropertyName(browserPrefix),
      visibilityEventName = getVisibilityEvent(browserPrefix);

    function onVisible() {
      // prevent double execution
      if (isPageVisible) {
        return;
      }
      // change flag value
      setIsPageVisible(true);
    }

    function onHidden() {
      // prevent double execution
      if (!isPageVisible) {
        return;
      }
      // change flag value
      setIsPageVisible(false);
    }

    function handleVisibilityChange(forcedFlag) {
      // forcedFlag is a boolean when this event handler is triggered by a
      // focus or blur eventotherwise it's an Event object
      if (typeof forcedFlag === "boolean") {
        if (forcedFlag) {
          return onVisible();
        }
        return onHidden();
      }
      if (document[hiddenPropertyName]) {
        return onHidden();
      }
      return onVisible();
    }

    const listener1 = document.addEventListener(
      visibilityEventName,
      handleVisibilityChange,
      false
    );

    // extra event listeners for better behaviour
    const listener2 = document.addEventListener(
      "focus",
      function () {
        handleVisibilityChange(true);
      },
      false
    );

    const listener3 = document.addEventListener(
      "blur",
      function () {
        handleVisibilityChange(false);
      },
      false
    );

    const listener4 = window.addEventListener(
      "focus",
      function () {
        handleVisibilityChange(true);
      },
      false
    );

    const listener5 = window.addEventListener(
      "blur",
      function () {
        handleVisibilityChange(false);
      },
      false
    );
    return () => {
      window.removeEventListener("blur", listener4);
      window.removeEventListener("focus", listener5);
      document.removeEventListener(visibilityEventName, listener1);
      document.removeEventListener("focus", listener2);
      document.removeEventListener("blur", listener3);
    };
  }, [isPageVisible]);

  useEffect(() => {
    const timerInterval = setInterval(() => {
      setTimeLeft((timeLeft) => timeLeft - 1);
    }, 1000);
    return () => clearInterval(timerInterval);
  }, [isPageVisible]);

  const getAnswerForQuestion = () => {
    return answer.filter(
      (ans) => ans.questionId === questions[currentQuestion].id
    )[0];
  };

  const closeCalculator = () => {
    setCalculatorOpen(false);
  };

  const handleMediaError = () => {
    handleUserViolation();
  };

  const checkMedia = useCallback(() => {
    navigator.mediaDevices
      .getUserMedia({ audio: true, video: true })
      .then(function (stream) {
        if (
          stream.getVideoTracks().length <= 0 ||
          stream.getAudioTracks().length <= 0
        ) {
          handleUserViolation();
        }
      })
      .catch((_err) => {
        handleUserViolation();
      });
  }, [handleUserViolation]);

  useEffect(() => {
    const mediaCheck = setInterval(checkMedia, 5 * 1000);
    return () => clearInterval(mediaCheck);
  }, [checkMedia]);

  return (
    <>
      <Prompt
        message={(location) =>
          `Are you sure you want to go to ${location.pathname}`
        }
      />
      <Dialog open={!isPageVisible && awayTimer > 0}>
        <DialogContent>Away for {awayTimer} seconds</DialogContent>
      </Dialog>
      <Dialog open={calculatorOpen} onClose={closeCalculator}>
        <DialogContent className="calculator_actual">
          <Calculator />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeCalculator} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
      <div className="test_container">
        <h1 className="test_header">{examDetail.title}</h1>
        <div className="test_details">
          <h3>Duration : {examDetail.duration} minutes</h3>
          <h3>
            Start Time : {new Date(examDetail.startTime).toDateString()}
            {new Date(examDetail.startTime).toLocaleTimeString()}
          </h3>
          <h3>
            End Time : {new Date(examDetail.endTime).toDateString()}
            {new Date(examDetail.endTime).toLocaleTimeString()}
          </h3>
        </div>
      </div>
      <div className="question_container">
        <div className="test_meta">
          <div className="test_meta_split">
            <Timer totalSeconds={timeLeft} />
          </div>
          <div className="test_meta_split">
            <Pagination
              variant="outlined"
              color="primary"
              count={questions.length}
              page={currentQuestion + 1}
              onChange={handleChange}
            />
          </div>
          <div className="test_meta_split">
            <IconButton
              className="calculator_btn"
              onClick={() => setCalculatorOpen(true)}
            >
              <img
                src={calculatorLogo}
                alt="Calculator"
                className="calculator_logo"
              />
            </IconButton>
          </div>
        </div>
        <MultipleChoiceQuestion
          question={questions[currentQuestion]}
          selectedAnswer={getAnswerForQuestion()}
          currentId={currentQuestion}
          answerMCQ={answerMCQ}
        />
      </div>
      <div className="webcam_container">
        <Webcam
          height={200}
          width={200}
          audio={true}
          videoConstraints={videoConstraints}
          screenshotFormat="image/jpeg"
          onUserMediaError={handleMediaError}
        />
      </div>
    </>
  );
};

export { StartTest };
