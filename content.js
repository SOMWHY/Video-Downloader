let videoSources = [];

function findVideos() {
  console.log('Searching for videos...');
  
  // 查找所有视频元素
  const videos = document.querySelectorAll('video');
  console.log('Found video elements:', videos);
  videoSources = [];

  // 查找所有 iframe 元素
  if(!videos.length>0){
  const iframes = document.querySelectorAll('iframe');
  console.log('Found iframe elements:', iframes);
  // 处理 iframe 元素
  iframes.forEach(iframe => {


    if (iframe.src&&iframe.style.display!=="none") {
      videoSources.push({
        src: iframe.src,
        type: 'iframe'
      });
    }
  });
}

  // 处理视频元素
  videos.forEach(video => {
    let src = video.src || video.currentSrc;
    if (!src) {
      const sources = video.querySelectorAll('source');
      if (sources.length > 0) {
        src = sources[0].src;
      }
    }
    if (src) {
      videoSources.push({
        src: src,
        type: video.getAttribute('type') || 'video/mp4'
      });
    }
  });


  // 查找 m3u8 源
  const scripts = document.querySelectorAll('script');
  scripts.forEach(script => {
    const content = script.textContent;
    const m3u8Match = content.match(/['"]((https?:)?\/\/.*?\.m3u8.*?)['"]/);
    if (m3u8Match) {
      videoSources.push({
        src: m3u8Match[1],
        type: 'application/x-mpegURL'
      });
    }
  });

  // 查找可能的视频 URL
  const urlRegex = /(https?:\/\/[^\s"']+\.(?:mp4|webm|ogg|m3u8))/g;
  const pageContent = document.body.innerText;
  let match;
  while ((match = urlRegex.exec(pageContent)) !== null) {
    videoSources.push({
      src: match[1],
      type: match[1].split('.').pop()
    });
  }

  console.log('Video sources:', videoSources);
  return videoSources;
}

// 初始查找
findVideos();

// 设置 MutationObserver 来监视 DOM 变化
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.addedNodes.length) {
      const newVideos = findVideos();
      if (newVideos.length > videoSources.length) {
        videoSources = newVideos;
        chrome.runtime.sendMessage({action: "updateVideos", videos: videoSources});
      }
    }
  });
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'findVideos') {
    sendResponse(videoSources);
  }
});

// 定期检查视频源

  setInterval(() => {
    const newVideos = findVideos();
    if (JSON.stringify(newVideos) !== JSON.stringify(videoSources)) {
      videoSources = newVideos;
      chrome.runtime.sendMessage({action: "updateVideos", videos: videoSources});
    }
  }, 5000);
