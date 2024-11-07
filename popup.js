let currentVideos = [];

function updateVideoList(videos) {
  const videoList = document.getElementById('videoList');
  videoList.innerHTML = '';
  if (videos && videos.length > 0) {
    videos.forEach((video, index) => {
      const videoContainer = document.createElement('div');
      videoContainer.className = 'video-item';

      const linkElement = document.createElement('a');
      linkElement.href = video.src;
      linkElement.textContent = video.src;
      linkElement.className = 'video-link';
      linkElement.target = '_blank';
      videoContainer.appendChild(linkElement);

      const button = document.createElement('button');
      button.textContent = `Download Video ${index + 1} (${video.type})`;
      button.className = 'download-button';
      button.onclick = function() {
        if (video.type === 'iframe') {
          chrome.tabs.create({ url: video.src });
        } else {
          chrome.downloads.download({
            url: video.src,
            filename: `video${index + 1}.${video.type === 'application/x-mpegURL' ? 'm3u8' : video.type}`,
            saveAs: true
          }, function(downloadId) {
            if (chrome.runtime.lastError) {
              console.error(chrome.runtime.lastError);
              alert('Download failed. Please check the console for more information.');
            } else {
              alert('Download started!');
            }
          });
        }
      };
      videoContainer.appendChild(button);

      videoList.appendChild(videoContainer);
    });
  } else {
    videoList.textContent = 'No videos found on this page.';
  }
}

document.addEventListener('DOMContentLoaded', function() {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {action: "findVideos"}, function(response) {
      currentVideos = response || [];
      updateVideoList(currentVideos);
    });
  });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "updateVideos") {
    currentVideos = request.videos;
    updateVideoList(currentVideos);
  }
});