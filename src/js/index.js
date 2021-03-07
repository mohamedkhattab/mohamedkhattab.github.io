import "../css/main.css";

import prList from "../components/prListComponent/prList.html";
import prListItem from "../components/prListComponent/prListItem.html";

const GTIHUB_TOKEN = "GTIHUB_TOKEN";
const cs = "iub_cookie_solution";
const mater = "mater";

let getGithubToken = (tokenName) => {
  let token = localStorage.getItem(tokenName);
  while (!token) {
    token = prompt("Please enter a github token:", "");
    if (token) localStorage.setItem(tokenName, token);
  }

  return token;
}

let render = (tmpl, params = {}) => {
  return tmpl.replaceAll(/\{\{(.+?)\}\}/g, (_, content) => {
    return params[content.trim()];
  });
}

let msToDaysAndHours = (ms) => {
  const cd = 24 * 60 * 60 * 1000;
  const ch = 60 * 60 * 1000;
  const d = Math.floor(ms / cd);
  const h = Math.floor((ms - d * cd) / ch);
  const pad = (n) => n < 10 ? '0' + n : n;

  if (h === 24) {
    d++;
    h = 0;
  }
  return `${d} day(s), ${pad(h)} hour(s) ago`;
}

let fetchAllPrs = async (repo, token) => {
  const res = await fetch(`https://api.github.com/repos/iubenda/${repo}/pulls?q=is%3Apr+is%3Aopen+sort%3Aupdated-desc&per_page=500`, {
    headers: {
      "Authorization": `token ${token}`
    }
  });

  return await res.json();
}

let createPrListItems = (prs) => {
  let devs = {};
  Object.keys(prs).forEach((pr) => {
    if (prs[pr].assignee) {
      const devHandle = prs[pr].assignee.login;
      const devUrl = prs[pr].assignee.html_url;
      const updatedAt = msToDaysAndHours(Date.now() - new Date(prs[pr].updated_at));
      if (devHandle) {
        devs[devHandle] = devs[devHandle] || { url: devUrl, items: "", prCount: 0 };
        const prItemData = {
          title: prs[pr].title,
          url: prs[pr].html_url,
          number: prs[pr].number,
          updatedAt: updatedAt,
        };
        devs[devHandle].prCount++;
        devs[devHandle].items += render(prListItem, prItemData);
      }
    }
  });

  return devs;
}

let createPrLists = (devs) => {
  let allLists = "";
  Object.keys(devs).forEach((devHandle) => {
    const devPrList = render(prList, {
      developerHandle: devHandle,
      items: devs[devHandle].items,
      prCount: devs[devHandle].prCount,
      url: devs[devHandle].url,
    });
    allLists += devPrList;
  });

  return allLists;
};

const init = async () => {
  document.querySelector(".app").innerHTML =
    createPrLists(
      createPrListItems(
        await fetchAllPrs(cs, 
          getGithubToken(GTIHUB_TOKEN)
        )
      )
    );
};

init();