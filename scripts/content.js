MutationObserver = window.MutationObserver;

window.xConsoomerPosts = {};
window.currentStatus = null;

const getPost = (article) => {
  try {
    // Query the article for the elements we need
    const usernameElement = article.querySelector('[data-testid="User-Name"]');
    const username = usernameElement.innerText.split("\n")[1].slice(1);
    const timestamp = article.querySelector("time").getAttribute("datetime");
    const content = article.querySelector(
      '[data-testid="tweetText"]'
    ).innerText;
    const stats = article.querySelector('[role="group"]').ariaLabel;

    const post = {
      user: username,
      ts: timestamp,
      txt: content,
      stats,
      og: window.currentStatus,
    };

    return post;
  } catch (e) {
    console.error(e);
    return null;
  }
};

const observer = new MutationObserver((mutations) => {
  // Check if we are in a status page
  const url = window.location.href;
  const isStatus = url.includes("/status/");
  if (!isStatus) {
    window.currentStatus = null;
  }

  const viewTimestamp = new Date().toISOString();
  for (let mutation of mutations) {
    for (let node of mutation.addedNodes) {
      if (!node.querySelectorAll) continue;
      let articles = node.querySelectorAll("article");
      for (let article of articles) {
        const post = getPost(article);
        if (!post) continue;
        post.viewTs = viewTimestamp;
        const key = `${post.user}-${post.ts}`;
        window.xConsoomerPosts[key] = post;

        // If we are in a status page, we want to keep track of the status
        if (
          isStatus &&
          article.tabIndex == -1 &&
          !article.innerText.endsWith("Show")
        ) {
          window.currentStatus = key;
        }
      }
    }
  }

  if (Object.keys(window.xConsoomerPosts).length > 100) {
    downloadPosts();
  }
});

observer.observe(document, { childList: true, subtree: true });

const downloadPosts = () => {
  // Download the posts as a JSON file
  const jsonPosts = JSON.stringify(window.xConsoomerPosts);
  const blob = new Blob([jsonPosts], { type: "octet/stream" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "x-consoomer-posts.json";
  link.click();

  window.xConsoomerPosts = {};
};

window.onbeforeunload = downloadPosts;
