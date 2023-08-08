let clickIt = document.getElementById("click-it");
let start = document.getElementById("lazy-click-start");
let end = document.getElementById("lazy-click-end");
let total = document.getElementById("lazy-click-total");

function onInput(e) {
  if (!e.target.value.trim() || !e.target.validity.valid || !isValidateTimeRange()) {
    clickIt.disabled = true;
    e.target.classList.add("error")
  } else {
    clickIt.disabled = false;
    e.target.classList.remove("error")
  }
  calculateTotal()
}

start.addEventListener("input", onInput);

end.addEventListener("input", onInput);

function isValidateTimeRange() {
  const startTime = start.value;
  const endTime = end.value;
  let res = false
  if (startTime && endTime && start.validity.valid && end.validity.valid) {
    if (startTime >= endTime) {
      res = false
    } else {
      res = true
    }
  }
  return res;
}

function calculateTimeDifference(start, end) {
  const startTime = new Date(`2000-01-01T${start}:00`);
  const endTime = new Date(`2000-01-01T${end}:00`);

  // Calculate the time difference in milliseconds
  const timeDiff = endTime - startTime;

  // Convert the time difference from milliseconds to minutes
  const minutesDiff = Math.floor(timeDiff / 60000);

  // Extract the hours and minutes from the total minutes difference
  const hours = Math.floor(minutesDiff / 60);
  const minutes = minutesDiff % 60;

  return { hours, minutes };
}

function addS(num) {
  return num > 1 ? "s" : "";
}

function calculateTotal() {
  const startTime = start.value;
  const endTime = end.value;
  if (isValidateTimeRange()) {
    const timeDifference = calculateTimeDifference(startTime, endTime)
    total.innerText = `Total: ${timeDifference.hours} hour${addS(timeDifference.hours)}${timeDifference.minutes ? ` and ${timeDifference.minutes} minute${addS(timeDifference.minutes)}` : ""}`
  } else {
    total.innerText = ""
  }

}

function onFinish() {
  document.getElementById("click-it").disabled = false;
}

function onStart() {
  document.getElementById("click-it").disabled = true;
}

clickIt.addEventListener("click", async (e) => {
  let start = document.getElementById("lazy-click-start");
  let end = document.getElementById("lazy-click-end");

  if(localStorage) {
    localStorage.setItem("lazy-click-start", start.value);
    localStorage.setItem("lazy-click-end", end.value);
  }

  chrome.storage.sync.set({
    startValue: start.value,
    endValue: end.value,
  });

  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });


  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: applyData,
  });
});


function applyData() {
  chrome.storage.sync.get([
    'startValue',
    'endValue',
  ], function({startValue, endValue }) {

    function selectAll() {
      const availableItems = [];

      const allItems = document.querySelectorAll("tr > .cDIES:nth-child(-n + 6)");
      allItems.forEach((parent) => {
        const paragraphs = parent.querySelectorAll('.cDM');
        if(paragraphs.length > 0) {
          const dateContent = paragraphs[0];

          const isEmpty = dateContent.innerHTML.trim() === '' || dateContent.innerHTML.trim() === '&nbsp;';

          if (isEmpty) {
            availableItems.push(parent)
          }
        }

      });

      if(availableItems?.length > 0) {

        Array.prototype.slice.call(availableItems).map(item => {
          item.click()
        });

        var selectDaysButton = document.querySelectorAll("input[name*=RefreshSelectedDays]")[0];

        selectDaysButton.click();
      } else {
        alert("No empty slots found")
      }

    }


    function fillIn(start, end) {
      var startVal = start || "10:00";
      var endVal = end || "19:00";
      const blurEvent = new Event('blur');

      Array.prototype.slice.call(document.querySelectorAll("input[name*=ManualEntry]")).map(item => {
        item.value = startVal
      });
      Array.prototype.slice.call(document.querySelectorAll("input[name*=ManualExit]")).map(item => {
        item.value = endVal
        item.focus();
        item.dispatchEvent(blurEvent);
      });
    }

    function fillAll(start, end) {
      selectAll();
      setTimeout(() => {
        fillIn(start, end);
      }, 2000)

    }

    if(window.location.href.includes("hilan.co.il/Hilannetv2/Attendance/calendarpage.aspx")) {
      try{
        fillAll(startValue, endValue)
      } catch (e) {
        console.error("failed to fill the data ", e)
      }
    } else {
      alert("You are not in hilan, you on: " + window.location.host + ". Please go to hilan Attendance page.")
    }
  });

}

window.onload = function () {
  if(localStorage) {
    const startVal = localStorage.getItem("lazy-click-start");
    const endVal = localStorage.getItem("lazy-click-end");
    if(startVal && endVal && start && end) {
      start.value = startVal
      end.value = endVal
    }
    calculateTotal();
    if (!isValidateTimeRange()) {
      clickIt.disabled = true;
    } else {
      clickIt.disabled = false;
    }
  }
}

