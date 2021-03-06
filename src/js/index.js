import "../css/main.css";

const GTIHUB_TOKEN = "GTIHUB_TOKEN";

// get the Github token from local storage
let token = localStorage.getItem(GTIHUB_TOKEN);
while(!token) {
  token = prompt("Please enter a github token:", "");
  if (token) localStorage.setItem(GTIHUB_TOKEN, token);
}

(async () => {
  const res = await fetch("https://api.github.com/repos/iubenda/iub_cookie_solution/pulls?q=is%3Apr+is%3Aopen+sort%3Aupdated-desc&per_page=500", {
    headers: {
      "Authorization": `token ${token}`
    }
  });

  const prs = await res.json();

  Object.keys(prs).forEach((pr) => {
    if (prs[pr].labels.length > 0) {
      console.log(prs[pr])
    }
  });
});