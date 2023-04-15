import './App.css';
import React, { useState, useRef } from 'react';
import axios from "axios";
import successImg from "./success.png"

function App() {
  const [email, setEmail] = useState("")
  const [otpEmail, setOtpEmail] = useState("")
  const [isOtpSend, setIsOtpSend] = useState(false)
  const [otp, setOtp] = useState("")
  const [sec, setSec] = useState(30)
  const [otpInput, setOtpInput] = useState({
    "1": "",
    "2": "",
    "3": "",
    "4": "",
  })
  const [isVerified, setIsVerified] = useState(false)
  const [errorEmail, setErrorEmail] = useState(false)

  var timer = useRef(null)
  var input1 = useRef(null)
  var input2 = useRef(null)
  var input3 = useRef(null)
  var input4 = useRef(null)

  const handleInput = (e) => {
    setEmail(e.target.value);
  }

  const generateOTP = () => {
    let otp = Math.floor(Math.random() * 9000) + 1000; // Generate a random 4-digit number
    while (otp.toString().includes('0') || otp.toString().includes('.')) { // Check if the number contains 0 or decimal point
      otp = Math.floor(Math.random() * 9000) + 1000; // If so, generate a new number
    }
    return otp.toString();
  }

  const handleEmailSubmit = (e, isResend = false) => {
    e?.preventDefault()
    if (!isResend && otpEmail && (otpEmail === email)) {
      setIsOtpSend(true)
      setOtpInput({
        "1": "",
        "2": "",
        "3": "",
        "4": "",
      })
      return
    }
    let GeneratedOtp = generateOTP()
    axios({
      method: 'post',
      url: 'https://api.sendinblue.com/v3/smtp/email',
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "api-key": process.env.REACT_APP_SENDINBLUE_API_KEY
      },
      data: {
        "sender": {
          "name": "Sender",
          "email": "naveenmohanty3@gmail.com"
        },
        "to": [
          {
            "name": "User",
            "email": email || otpEmail
          }
        ],
        "htmlContent": `<!DOCTYPE html> <html> <body> <h1>Your OTP: ${GeneratedOtp}</h1> </html>`,
        "subject": "Login Email OTP"
      }
    }).then((response) => {
      if (response?.data?.messageId) {
        !isResend && setOtpEmail(email)
        setIsOtpSend(true)
        setOtp(GeneratedOtp)
        timer.current && clearInterval(timer.current)
        setSec(30)
        setOtpInput({
          "1": "",
          "2": "",
          "3": "",
          "4": "",
        })
        setTimeout(() => { input1.current.focus() }, 10)
        timer.current = setInterval(function () {
          setSec(prev => {
            if (prev === 0) {
              clearInterval(timer.current)
              setOtp("")
              return 0
            } else {
              return prev - 1
            }
          })
        }, 1000)
        setEmail("")
      }
    }).catch((error) => {
      console.warn(error);
    });
  }

  const goback = (e) => {
    e?.preventDefault()
    if (sec === 0) {
      setEmail("")
      setOtpEmail("")
      setOtp("")
    } else {
      setEmail(otpEmail)
    }
    setIsOtpSend(false)
  }

  const handleOtpInput = (e) => {
    let { name, value } = e.target
    value = value.replace(/[^0-9]/g, '')
    let otpObj = { ...otpInput }
    if (name === "1" && !otpObj["2"] && value) {
      input2.current.focus()
    } else if (name === "2" && !otpObj["3"] && value) {
      input3.current.focus()
    } else if (name === "3" && !otpObj["4"] && value) {
      input4.current.focus()
    }
    otpObj[name] = value
    setErrorEmail(false)
    setOtpInput(otpObj)
  }

  const verifyOtp = (e) => {
    e?.preventDefault()
    let enteredOtp = otpInput["1"] + otpInput["2"] + otpInput["3"] + otpInput["4"]
    if (enteredOtp === otp) {
      setIsVerified(true)
      setErrorEmail(false)
      timer.current && clearInterval(timer.current)
      setOtp("")
    } else {
      setErrorEmail(true)
    }
  }

  return (
    <div className="container">
      <form onSubmit={(e) => { isOtpSend ? verifyOtp(e) : handleEmailSubmit(e) }}>
        {isVerified ?
          <>
            <img src={successImg} alt="OTP verified" width="90%" />
            <p className="required-text">OTP Verified!</p>
          </>
          : isOtpSend ? <>
            <h2>Enter OTP</h2>
            <p className="required-text">Please enter the OTP sent to</p>
            <p className="required-text mb">{otpEmail} <span onClick={goback}>Change</span></p>
            <div className='otp-btns'>
              <input ref={input1} type="text" maxLength={1} name='1' value={otpInput["1"]} onChange={handleOtpInput} />
              <input ref={input2} type="text" maxLength={1} name='2' value={otpInput["2"]} onChange={handleOtpInput} />
              <input ref={input3} type="text" maxLength={1} name='3' value={otpInput["3"]} onChange={handleOtpInput} />
              <input ref={input4} type="text" maxLength={1} name='4' value={otpInput["4"]} onChange={handleOtpInput} />
            </div>
            <p className="required-text error" style={{ visibility: errorEmail ? "visible" : "hidden" }}>*Invalid OTP</p>
            {sec ? <p className="required-text">OTP expiers in {sec}s</p>
              : <p className="required-text">Didn't recived OTP? <span onClick={(e) => { handleEmailSubmit(e, true) }}>Resend</span></p>}
            <button type="submit" className="submit-button">
              Verify
            </button>
          </>
            :
            <>
              <h2>Enter Your Email</h2>
              <input type="email" placeholder="*Email" required={true} value={email} onChange={handleInput} />
              <button type="submit" className="submit-button">
                Request OTP
              </button>
            </>}
      </form>
    </div>
  );
}

export default App;
