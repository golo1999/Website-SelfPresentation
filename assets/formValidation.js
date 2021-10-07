const form = document.querySelector("form");
const nameInput = document.querySelectorAll("input[type=text]")[0];
const emailInput = document.querySelector("input[type=email]");
const subjectInput = document.querySelectorAll("input[type=text]")[1];
const messageInput = document.querySelector("textarea");
const sendEmail = document.querySelector("button");

sendEmail.onclick = () => {
  if (
    nameInput.value !== "" &&
    emailInput.value !== "" &&
    subjectInput.value !== "" &&
    messageInput.value !== ""
  ) {
    form.submit();
  } else {
    alert("Please complete the form first");
    return false;
  }
};
