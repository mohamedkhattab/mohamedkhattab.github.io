import "../css/main.css";

import prList from "../components/prListComponent/prList.html";
import prListItem from "../components/prListComponent/prListItem.html";

const GTIHUB_TOKEN = "GTIHUB_TOKEN";

// get the Github token from local storage
let token = localStorage.getItem(GTIHUB_TOKEN);
while(!token) {
  token = prompt("Please enter a github token:", "");
  if (token) localStorage.setItem(GTIHUB_TOKEN, token);
}

let render = (tmpl, params = {}) => {
  return tmpl.replaceAll(/\{\{(.+?)\}\}/g, (_, content) => {
    return params[content.trim()];
  });
}

(async () => {
  const res = await fetch("https://api.github.com/repos/iubenda/iub_cookie_solution/pulls?q=is%3Apr+is%3Aopen+sort%3Aupdated-desc&per_page=500", {
    headers: {
      "Authorization": `token ${token}`
    }
  });

  const prs = await res.json();

  let devs = {};
  let allLists = "";

  // console.log(prs);
  Object.keys(prs).forEach((pr) => {
    const devHandle = prs[pr].assignee && prs[pr].assignee.login;
    if (devHandle) {
      devs[devHandle] = devs[devHandle] || {items: "", prCount: 0};
      const prItemdata = {
        title: prs[pr].title,
        url: prs[pr].url,
      };
      devs[devHandle].prCount++;
      devs[devHandle].items += render(prListItem, prItemdata);
    }
    
    
  });
  
  Object.keys(devs).forEach((devHandle) => {
    const devPrList = render(prList, {
      developerHandle: devHandle,
      items: devs[devHandle].items,
      prCount: devs[devHandle].prCount,
    });
    allLists += devPrList;
  });

  document.querySelector(".app").innerHTML =  allLists;
})();