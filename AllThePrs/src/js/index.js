import "../css/main.css";

import prList from "../components/prListComponent/prList.html";
import prListItem from "../components/prListComponent/prListItem.html";
import prListContainer from "../components/prListComponent/prListContainer.html";

import repoSelector from "../components/repoSelectorComponent/repoSelector.html";
import select from "../components/selectComponent/select.html";
import option from "../components/selectComponent/option.html";

import spinner from "../components/spinnerComponent/spinner.html";

import tokenForm from "../components/tokenFormComponent/tokenForm.html";

const GTIHUB_TOKEN = "GTIHUB_TOKEN";
const REPO_NAME = "REPO_NAME";
const repoNames = {
  "Cookie Solution": "iub_cookie_solution",
  "Mater": "mater",
  "Radar": "iubenda-radar",
};
const repoSelectorId = "repo-selector";
const githubTokenInputId = "github-token-input";
const githubTokenSubmitId = "github-token-submit";
const appElement = document.querySelector(".app");

const githubTokenRegex = /^[0-9a-f]{40}$/;

const setState = (prop, value) => {
  localStorage.setItem(prop, value)
};

const getState = (prop) => {
  return localStorage.getItem(prop)
}

const objectToArray = (obj, storeKeys = false) => {
  let arr = [];
  Object.keys(obj).forEach((key) => {
    arr.push((storeKeys)? {...obj[key], key: key} : obj[key]);
  });

  return arr;
};

const getGithubToken = (tokenName) => {
  let token = localStorage.getItem(tokenName);
  while (!token) {
    token = prompt("Please enter a github token:", "");
    if (token) localStorage.setItem(tokenName, token);
  }

  return token;
}

const render = (tmpl, params = {}) => {
  return tmpl.replaceAll(/\{\{(.+?)\}\}/g, (_, content) => {
    return params[content.trim()];
  });
}

const msToDaysAndHours = (ms) => {
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

const fetchAllPrs = async (repo, token) => { 
  const res = await fetch(`https://api.github.com/repos/iubenda/${repo}/pulls?q=is%3Apr+is%3Aopen+sort%3Aupdated-desc&per_page=500`, {
    headers: {
      "Authorization": `token ${token}`
    }
  });

  return await res.json();
}

const createPrListItems = (prs) => {
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

const createPrLists = (devs) => {
  let allLists = "";
  let devsArr = objectToArray(devs, true);
  
  devsArr = devsArr.sort((a, b) => {
    return b["prCount"] - a["prCount"];
  });
  
  devsArr.forEach((dev) => {
    const devPrList = render(prList, {
      developerHandle: dev.key,
      items: dev.items,
      prCount: dev.prCount,
      url: dev.url,
    });
    allLists += devPrList;
  });

  return allLists;
};

const createPrListContainer = (prLists) => {
  return render(prListContainer, {prLists: prLists});
};

const createRepoSelector = (repoNames, repoSelectorId) => {
  let options = "";

  Object.keys(repoNames).forEach((name) => {
    let selected = "";
    if (repoNames[name] === getState(REPO_NAME)) selected = "selected";
    options += render(option, {
      text: name,
      value: repoNames[name],
      selected: selected,
    });
  });

  const selector = render(select, {options: options, id: repoSelectorId});

  return render(repoSelector, {selector: selector});
};

const setAppContent = async (repoName) => {
  const token = getState(GTIHUB_TOKEN);

  if (!token) {
    appElement.innerHTML = render(tokenForm, {
      githubTokenInputId: githubTokenInputId,
      githubTokenSubmitId: githubTokenSubmitId
    });
  } else {
    appElement.innerHTML = render(spinner);

    const prs = await fetchAllPrs(repoName, getGithubToken(GTIHUB_TOKEN));
    appElement.innerHTML =
      createRepoSelector(repoNames, repoSelectorId) +
      createPrListContainer(
        createPrLists(
          createPrListItems(prs)
        )
      );
  }
}

const init = () => {
  if (!getState(REPO_NAME)) setState(REPO_NAME, repoNames["Cookie Solution"]);

  setAppContent(getState(REPO_NAME));
  appElement.addEventListener("click", (evt) => {
    const target = evt.target;
    if (target.id === repoSelectorId && target.value !== getState(REPO_NAME)) {
      setState(REPO_NAME, target.value);
      setAppContent( getState(REPO_NAME) );
    }

    if (target.id === githubTokenSubmitId) {
      const token = document.querySelector(`#${githubTokenInputId}`).value;
      if (!githubTokenRegex.test(token)) {
        alert("invalid token, please try again");
      } else {
        setState(GTIHUB_TOKEN, token);
        setAppContent( getState(REPO_NAME) );
      }
    }
  });
};

init();