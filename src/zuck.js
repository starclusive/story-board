/*
    zuck.js
    https://github.com/ramon82/zuck.js
    MIT License
*/
module.exports = (window => {
  /* Utilities */
  const query = function (qs) {
    return document.querySelectorAll(qs)[0];
  };

  const get = function (array, what) {
    if (array) {
      return array[what] || '';
    } else {
      return '';
    }
  };

  const each = function (arr, func) {
    if (arr) {
      const total = arr.length;

      for (let i = 0; i < total; i++) {
        func(i, arr[i]);
      }
    }
  };

  const setVendorVariable = function (ref, variable, value) {
    const variables = [
      variable.toLowerCase(),
      `webkit${variable}`,
      `MS${variable}`,
      `o${variable}`
    ];

    each(variables, (i, val) => {
      ref[val] = value;
    });
  };

  const addVendorEvents = function (el, func, event) {
    const events = [
      event.toLowerCase(),
      `webkit${event}`,
      `MS${event}`,
      `o${event}`
    ];

    each(events, (i, val) => {
      el.addEventListener(val, func, false);
    });
  };

  const onAnimationEnd = function (el, func) {
    addVendorEvents(el, func, 'AnimationEnd');
  };

  const onTransitionEnd = function (el, func) {
    if (!el.transitionEndEvent) {
      el.transitionEndEvent = true;

      addVendorEvents(el, func, 'TransitionEnd');
    }
  };

  const prepend = function (parent, child) {
    if (parent.firstChild) {
      parent.insertBefore(child, parent.firstChild);
    } else {
      parent.appendChild(child);
    }
  };

  const generateId = () => {
    return 'stories-' + Math.random().toString(36).substr(2, 9);
  };

  const userViewerView = function (viewersArray) {
    let viewersItemView = '';
    viewersArray.map((item) => {
      viewersItemView += `
  <li>
  <div class="media s-v-media align-items-center">
    <img src="${item.profileThumbs ? item.profileThumbs.split(',')[0] : 'https://starclusive-static-assets.s3.amazonaws.com/user-avatar.png'}">
    <div class="media-body">
      <h4>${item.name}</h4>
    </div>
  </div>
</li>
  `;
    });
    return viewersItemView;
  };

  /* Zuckera */
  const ZuckJS = function (timeline, options) {
    const zuck = this;
    const option = function (name, prop) {
      const type = function (what) {
        return typeof what !== 'undefined';
      };

      if (prop) {
        if (type(options[name])) {
          return type(options[name][prop]) ?
            options[name][prop] :
            optionsDefault[name][prop];
        } else {
          return optionsDefault[name][prop];
        }
      } else {
        return type(options[name]) ? options[name] : optionsDefault[name];
      }
    };

    const fullScreen = function (elem, cancel) {
      const func = 'RequestFullScreen';
      const elFunc = 'requestFullScreen'; // crappy vendor prefixes.

      try {
        if (cancel) {
          if (
            document.fullscreenElement ||
            document.webkitFullscreenElement ||
            document.mozFullScreenElement ||
            document.msFullscreenElement
          ) {
            if (document.exitFullscreen) {
              document.exitFullscreen()
                .catch(() => {});
            } else if (document.mozCancelFullScreen) {
              document.mozCancelFullScreen()
                .catch(() => {});
            } else if (document.mozCancelFullScreen) {
              document.mozCancelFullScreen()
                .catch(() => {});
            }
          }
        } else {
          if (elem[elFunc]) {
            elem[elFunc]();
          } else if (elem[`ms${func}`]) {
            elem[`ms${func}`]();
          } else if (elem[`moz${func}`]) {
            elem[`moz${func}`]();
          } else if (elem[`webkit${func}`]) {
            elem[`webkit${func}`]();
          }
        }
      } catch (e) {
        console.warn('[Zuck.js] Can\'t access fullscreen');
      }
    };

    const translate = function (element, to, duration, ease) {
      const direction = to > 0 ? 1 : -1;
      const to3d = (Math.abs(to) / query('#zuck-modal').offsetWidth) * 90 * direction;

      if (option('cubeEffect')) {
        const scaling = to3d === 0 ? 'scale(0.95)' : 'scale(0.930,0.930)';

        setVendorVariable(
          query('#zuck-modal-content').style,
          'Transform',
          scaling
        );

        if (to3d < -90 || to3d > 90) {
          return false;
        }
      }

      const transform = !option('cubeEffect') ?
        `translate3d(${to}px, 0, 0)` :
        `rotateY(${to3d}deg)`;

      if (element) {
        setVendorVariable(element.style, 'TransitionTimingFunction', ease);
        setVendorVariable(element.style, 'TransitionDuration', `${duration}ms`);
        setVendorVariable(element.style, 'Transform', transform);
      }
    };

    const findPos = function (obj, offsetY, offsetX, stop) {
      let curleft = 0;
      let curtop = 0;

      if (obj) {
        if (obj.offsetParent) {
          do {
            curleft += obj.offsetLeft;
            curtop += obj.offsetTop;

            if (obj === stop) {
              break;
            }
          } while ((obj = obj.offsetParent));
        }

        if (offsetY) {
          curtop = curtop - offsetY;
        }

        if (offsetX) {
          curleft = curleft - offsetX;
        }
      }

      return [curleft, curtop];
    };

    if (typeof timeline === 'string') {
      timeline = document.getElementById(timeline);
    }

    if (!timeline.id) {
      timeline.setAttribute('id', generateId());
    }

    const timeAgo = function (time) {
      time = Number(time) * 1000;

      const dateObj = new Date(time);
      const dateStr = dateObj.getTime();
      let seconds = (new Date().getTime() - dateStr) / 1000;

      const language = option('language', 'time');

      const formats = [
        [60, ` ${language.seconds}`, 1], // 60
        [120, `1 ${language.minute}`, ''], // 60*2
        [3600, ` ${language.minutes}`, 60], // 60*60, 60
        [7200, `1 ${language.hour}`, ''], // 60*60*2
        [86400, ` ${language.hours}`, 3600], // 60*60*24, 60*60
        [172800, ` ${language.yesterday}`, ''], // 60*60*24*2
        [604800, ` ${language.days}`, 86400]
      ];

      let currentFormat = 1;
      if (seconds < 0) {
        seconds = Math.abs(seconds);

        currentFormat = 2;
      }

      let result = false;
      each(formats, (formatKey, format) => {
        if (seconds < format[0] && !result) {
          if (typeof format[2] === 'string') {
            result = format[currentFormat];
          } else if (format !== null) {
            result = Math.floor(seconds / format[2]) + format[1];
          }
        }
      });

      if (!result) {
        const day = dateObj.getDate();
        const month = dateObj.getMonth();
        const year = dateObj.getFullYear();

        return `${day}/${month + 1}/${year}`;
      } else {
        return result;
      }
    };

    /* options */
    const id = timeline.id;
    const optionsDefault = {
      rtl: false,
      skin: 'snapgram',
      avatars: true,
      stories: [],
      backButton: true,
      backNative: false,
      paginationArrows: false,
      previousTap: true,
      autoFullScreen: false,
      openEffect: true,
      cubeEffect: false,
      list: false,
      localStorage: true,
      callbacks: {
        onOpen: function (storyId, callback) {
          callback();
        },
        onView: function (storyId) {},
        onEnd: function (storyId, callback) {
          callback();
        },
        onClose: function (storyId, callback) {
          callback();
        },
        onNextItem: function (storyId, nextStoryId, callback) {
          callback();
        },
        onNavigateItem: function (storyId, nextStoryId, callback) {
          callback();
        }
      },
      template: {
        timelineItem(itemData) {
          return `
                  <div class="story ${get(itemData, 'seen') === true ? (!get(itemData, 'ownStory') ? 'seen' : 'ownStorySeen') : ''}">
                  <a class="item-link" href="${get(itemData, 'link')}">
                  <span class="item-preview">
                  <img lazy="eager" src="${get(itemData, 'currentPreview')}" />
                  </span>
                  <span class="info" itemProp="author" itemScope itemType="http://schema.org/Person">
                  <strong class="name" itemProp="name">${get(itemData, 'name')}</strong>
                  <span class="time">${get(itemData, 'lastUpdatedAgo')}</span>
                  </span>
                  <div class="upload-btn-wrapper align-self-center user-image cursor-pointer">
                  <img src="${(option('avatars') || !get(itemData, 'currentPreview'))
              ? get(itemData, 'photo')
              : get(itemData, 'currentPreview')
            }" alt="" class="t-img rounded-circle">
                  </div>
                  </a>
                  <ul class="items"></ul>
                  </div>`;
        },

        timelineStoryItem(itemData) {
          const reserved = ['id', 'seen', 'src', 'link', 'linkText', 'time', 'type', 'length', 'preview'];
          let attributes = `
                    href="${get(itemData, 'src')}"
                    data-link="${get(itemData, 'link')}"
                    data-linkText="${get(itemData, 'linkText')}",
                    data-time="${get(itemData, 'time')}"
                    data-type="${get(itemData, 'type')}"
                    data-length="${get(itemData, 'length')}"
                    data-seen="${get(itemData, 'seen')}"
                    `;
          for (const dataKey in itemData) {
            if (reserved.indexOf(dataKey) === -1) {
              attributes += ` data-${dataKey}="${itemData[dataKey]}"`;
            }
          }

          return `<a ${attributes}>
<img loading="auto" src="${get(itemData, 'preview')}" />
</a>`;
        },

        viewerItem(storyData, currentStoryItem) {
          return `<div class="story-viewer">
                  <div class="head">
                      <div class="left profile_routing" style="cursor: pointer;" > ${option('backButton') ? '<a class="back">&lsaquo;</a>' : ''} <span class="item-preview profile_routing" style="cursor: pointer;" >
                  <img lazy="eager" class="profilePhoto profile_routing" style="cursor: pointer;"  src="${get(storyData, 'photo')}" />
                </span>
                          <div class="info profile_routing" style="cursor: pointer;" > <strong class="name profile_routing" style="cursor: pointer;" >${get(storyData, 'name')}</strong> <span class="time profile_routing" style="cursor: pointer;" >${get(storyData, 'timeAgo')}</span> </div>
                      </div>
                      
                      <div class="right "> <span class="time">${get(currentStoryItem, 'timeAgo')}</span> <span class="loading"></span>
                          <a class="close" tabIndex="2"> <img src="assets/img/Layer 3.svg" style="height:30px;width:30px"> </a>
                      </div>
                      ${storyData.ownStory?`<div class="right"> 
                      <a class="viewID" tabIndex="2"> <svg id="open_eye" xmlns="http://www.w3.org/2000/svg" width="25px" height="25px" viewBox="0 0 24 24">
                      <path d="M12.015 7c4.751 0 8.063 3.012 9.504 4.636-1.401 1.837-4.713 5.364-9.504 5.364-4.42 0-7.93-3.536-9.478-5.407 1.493-1.647 4.817-4.593 9.478-4.593zm0-2c-7.569 0-12.015 6.551-12.015 6.551s4.835 7.449 12.015 7.449c7.733 0 11.985-7.449 11.985-7.449s-4.291-6.551-11.985-6.551zm-.015 3c-2.209 0-4 1.792-4 4 0 2.209 1.791 4 4 4s4-1.791 4-4c0-2.208-1.791-4-4-4z" style="fill: #fff;"/>
                      </svg>
                      </a>
                     </div>`:``}
                     ${storyData.ownStory?`<div class="delete" id="delet_eye0"> 
                      <a class="viewDeleteID" id="delet_eye1" tabIndex="2"> <svg id="delet_eye2" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><path id="delet_eye3" d="M0 0h24v24H0z" fill="none"/><path id="delet_eye4" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" style="fill: #fff;"/></svg>
                      </a>
                     </div>`:``}
                      </div>
                  <div class="slides-pointers">
                      <div class="wrap"></div>
                  </div> ${option('paginationArrows') ? `
                  <div class="slides-pagination"> <span class="previous">&lsaquo;</span> <span class="next">&rsaquo;</span> </div>` : ''} 
              </div>`;
        },

        viewerItemPointer(index, currentIndex, item) {
          return `<span 
class="${currentIndex === index ? 'active' : ''} ${get(item, 'seen') === true ? 'seen' : ''}"
data-index="${index}" data-item-id="${get(item, 'id')}">
<b style="animation-duration:${get(item, 'length') === '' ? '3' : get(item, 'length')}s"></b>
</span>`;
        },

        viewerItemBody(index, currentIndex, item) {
          return `<div 
class="item ${(get(item, 'seen')) || get(item, 'isStorySeen') === true ? 'seen' : 'notSeenStory'} ${currentIndex === index ? 'active' : ''}"
data-time="${get(item, 'time')}" data-type="${get(item, 'type')}" data-index="${index}" data-item-id="${get(item, 'id')}">
<div id="story-left"  class="story-left" title="Previous Story">
<svg id="story-left1" class="story-left1" xmlns="http://www.w3.org/2000/svg" width="11.486" height="20.861" viewBox="0 0 11.486 20.861" style="&#10;  
              height: 30px;&#10;    width: 30px;&#10;"><g class="story-left2" id="story-left2" transform="translate(0 0)">
              <path class="story-left3" id="story-left3" style="fill:white" d="M65.294,11.176l-9.381,9.378a1.053,1.053,0,0,1-1.491-1.488l8.637-8.634L54.423,1.8A1.054,
              1.054,0,0,1,55.914.309L65.3,9.687A1.063,1.063,0,0,1,65.294,11.176Z" transform="translate(-54.113 -0.001)"/>
              </g></svg></div>
${get(item, 'type') === 'video'
              ? `<video id="videoTag" class="media videoActive" muted webkit-playsinline playsinline preload="auto" src="${get(item, 'src')}" ${get(item, 'type')}></video>`
              : `<img loading="auto" class="media" src="${get(item, 'src')}" ${get(item, 'type')} />
`}
${get(item, 'type') === 'video'
? `<div class="m-u-btn-group"><b class="tip muted mutedVideo" style="line-height: normal;
padding: 10px 15px !important;display:block !important;" id="videoMute">${option('language', 'unmute')}</b>
    <b class="tip muted unmutedVideo" style="line-height: normal;
    padding: 10px 15px !important;display:none !important;" id="videoUNMute">${option('language', 'mute')}</b>
    </div>`
: ``}
${item.ownStory
              ? `<div class="s-v-block" style="display:none">
<label class="v-label" id="ViewStoryCount">
${item.totalViewCount ? `Viewer(s)` : 'No Viewer(s) Yet'} </label>
<ul class="list-unstyled s-v-list">
${item.viewersDetails.length > 0
                ? userViewerView(item.viewersDetails)
                : ''}
</ul>
</div>` : ''}
${item.ownStory || (!item.ownStory && !item.isSubscribed && item.isFavouriteAdded)
  ? ' ':`
  <div class="col-lg-8 col-md-8 col-10 tip link">
  <div class="container">
  <div class="chat-panel" style="display:none;width: 250px;position: absolute;
  bottom: 100%;
  right: 0;
  background: #fff;
  font-size:16px !important;
  border-radius:6px">
    <div class="emoji-header menu-tabs hor-flex-parent">
      <span class="menu-item flex-kid" data-react="smileys-and-people">😀</span>
      <span class="menu-item flex-kid" data-react="animals-and-nature">🐶</span>
      <span class="menu-item flex-kid" data-react="food-and-drink">🍏</span>
      <span class="menu-item flex-kid" data-react="activity">⚽</span>
      <span class="menu-item flex-kid" data-react="travel-and-places">🚗</span>
      <span class="menu-item flex-kid" data-react="objects">⌚</span>
      <span class="menu-item flex-kid" data-react="symbols">💛</span>
    </div>
    <div class="emoji-panel">
    <div data-react="smileys-and-people" class="emoji-panel-tab-smileys-and-people">
      <span>😀</span>
      <span>😬</span>
      <span>😁</span>
      <span>😂</span>
      <span>😃</span>
      <span>😄</span>
      <span>😅</span>
      <span>😆</span>
      <span>😇</span>
      <span>😉</span>
      <span>😊</span>
      <span>🙂</span>
      <span>🙃</span>
      <span>😋</span>
      <span>😌</span>
      <span>😍</span>
      <span>😘</span>
      <span>😗</span>
      <span>😙</span>
      <span>😚</span>
      <span>😜</span>
      <span>😝</span>
      <span>😛</span>
      <span>🤑</span>
      <span>🤓</span>
      <span>😎</span>
      <span>🤗</span>
      <span>😏</span>
      <span>😶</span>
      <span>😐</span>
      <span>😑</span>
      <span>😒</span>
      <span>🙄</span>
      <span>🤔</span>
      <span>😳</span>
      <span>😞</span>
      <span>😟</span>
      <span>😠</span>
      <span>😡</span>
      <span>😔</span>
      <span>😕</span>
      <span>🙁</span>
      <span>😣</span>
      <span>😖</span>
      <span>😫</span>
      <span>😩</span>
      <span>😤</span>
      <span>😮</span>
      <span>😱</span>
      <span>😨</span>
      <span>😰</span>
      <span>😯</span>
      <span>😦</span>
      <span>😧</span>
      <span>😢</span>
      <span>😥</span>
      <span>😪</span>
      <span>😓</span>
      <span>😭</span>
      <span>😵</span>
      <span>😲</span>
      <span>🤐</span>
      <span>😷</span>
      <span>🤒</span>
      <span>🤕</span>
      <span>😴</span>
      <span>💤</span>
      <span>💩</span>
      <span>😈</span>
      <span>👿</span>
      <span>👹</span>
      <span>👺</span>
      <span>💀</span>
      <span>👻</span>
      <span>👽</span>
      <span>🤖</span>
      <span>😺</span>
      <span>😸</span>
      <span>😹</span>
      <span>😻</span>
      <span>😼</span>
      <span>😽</span>
      <span>🙀</span>
      <span>😿</span>
      <span>😾</span>
      <span>🙌</span>
      <span>👏</span>
      <span>👋</span>
      <span>👍</span>
      <span>👎</span>
      <span>👊</span>
      <span>✊</span>
      <span>👌</span>
      <span>✋</span>
      <span>👐</span>
      <span>💪</span>
      <span>🙏</span>
      <span>👆</span>
      <span>👇</span>
      <span>👈</span>
      <span>👉</span>
      <span>🖕</span>
      <span>🖐</span>
      <span>🤘</span>
      <span>🖖</span>
      <span>💅</span>
      <span>👄</span>
      <span>👅</span>
      <span>👂</span>
      <span>👃</span>
      <span>👁</span>
      <span>👀</span>
      <span>👤</span>
      <span>👥</span>
      <span>🗣</span>
      <span>👶</span>
      <span>👦</span>
      <span>👧</span>
      <span>👨</span>
      <span>👩</span>
      <span>👱</span>
      <span>👴</span>
      <span>👵</span>
      <span>👲</span>
      <span>👳</span>
      <span>👮</span>
      <span>👷</span>
      <span>💂</span>
      <span>🕵</span>
      <span>🎅</span>
      <span>👼</span>
      <span>👸</span>
      <span>👰</span>
      <span>🚶</span>
      <span>🏃</span>
      <span>💃</span>
      <span>👯</span>
      <span>👫</span>
      <span>👬</span>
      <span>👭</span>
      <span>🙇</span>
      <span>💁</span>
      <span>🙅</span>
      <span>🙆</span>
      <span>🙋</span>
      <span>🙎</span>
      <span>🙍</span>
      <span>💇</span>
      <span>💆</span>
      <span>💑</span>
      <span>👩‍❤️‍👩</span>
      <span>👨‍❤️‍👨</span>
      <span>💏</span>
      <span>👩‍❤️‍💋‍👩</span>
      <span>👨‍❤️‍💋‍👨</span>
      <span>👪</span>
      <span>👨‍👩‍👧</span>
      <span>👨‍👩‍👧‍👦</span>
      <span>👨‍👩‍👦‍👦</span>
      <span>👨‍👩‍👧‍👧</span>
      <span>👩‍👩‍👦</span>
      <span>👩‍👩‍👧</span>
      <span>👩‍👩‍👧‍👦</span>
      <span>👩‍👩‍👦‍👦</span>
      <span>👩‍👩‍👧‍👧</span>
      <span>👨‍👨‍👦</span>
      <span>👨‍👨‍👧</span>
      <span>👨‍👨‍👧‍👦</span>
      <span>👨‍👨‍👦‍👦</span>
      <span>👨‍👨‍👧‍👧</span>
      <span>👚</span>
      <span>👕</span>
      <span>👖</span>
      <span>👔</span>
      <span>👗</span>
      <span>👙</span>
      <span>👘</span>
      <span>💄</span>
      <span>💋</span>
      <span>👣</span>
      <span>👠</span>
      <span>👡</span>
      <span>👢</span>
      <span>👞</span>
      <span>👟</span>
      <span>👒</span>
      <span>🎩</span>
      <span>🎓</span>
      <span>👑</span>
      <span>⛑</span>
      <span>🎒</span>
      <span>👝</span>
      <span>👛</span>
      <span>👜</span>
      <span>💼</span>
      <span>👓</span>
      <span>🕶</span>
      <span>💍</span>
      <span>🌂</span>
    </div>
    <div data-react="animals-and-nature" style="display:none" class="emoji-panel-tab-animals-and-nature">
      <span>🐶</span>
      <span>🐱</span>
      <span>🐭</span>
      <span>🐹</span>
      <span>🐰</span>
      <span>🐻</span>
      <span>🐼</span>
      <span>🐨</span>
      <span>🐯</span>
      <span>🦁</span>
      <span>🐮</span>
      <span>🐷</span>
      <span>🐽</span>
      <span>🐸</span>
      <span>🐙</span>
      <span>🐵</span>
      <span>🙈</span>
      <span>🙉</span>
      <span>🙊</span>
      <span>🐒</span>
      <span>🐔</span>
      <span>🐧</span>
      <span>🐦</span>
      <span>🐤</span>
      <span>🐣</span>
      <span>🐥</span>
      <span>🐺</span>
      <span>🐗</span>
      <span>🐴</span>
      <span>🦄</span>
      <span>🐝</span>
      <span>🐛</span>
      <span>🐌</span>
      <span>🐞</span>
      <span>🐜</span>
      <span>🕷</span>
      <span>🦂</span>
      <span>🦀</span>
      <span>🐍</span>
      <span>🐢</span>
      <span>🐠</span>
      <span>🐟</span>
      <span>🐡</span>
      <span>🐬</span>
      <span>🐳</span>
      <span>🐋</span>
      <span>🐊</span>
      <span>🐆</span>
      <span>🐅</span>
      <span>🐃</span>
      <span>🐂</span>
      <span>🐄</span>
      <span>🐪</span>
      <span>🐫</span>
      <span>🐘</span>
      <span>🐐</span>
      <span>🐏</span>
      <span>🐑</span>
      <span>🐎</span>
      <span>🐖</span>
      <span>🐀</span>
      <span>🐁</span>
      <span>🐓</span>
      <span>🦃</span>
      <span>🕊</span>
      <span>🐕</span>
      <span>🐩</span>
      <span>🐈</span>
      <span>🐇</span>
      <span>🐿</span>
      <span>🐾</span>
      <span>🐉</span>
      <span>🐲</span>
      <span>🌵</span>
      <span>🎄</span>
      <span>🌲</span>
      <span>🌳</span>
      <span>🌴</span>
      <span>🌱</span>
      <span>🌿</span>
      <span>🍀</span>
      <span>🎍</span>
      <span>🎋</span>
      <span>🍃</span>
      <span>🍂</span>
      <span>🍁</span>
      <span>🌾</span>
      <span>🌺</span>
      <span>🌻</span>
      <span>🌹</span>
      <span>🌷</span>
      <span>🌼</span>
      <span>🌸</span>
      <span>💐</span>
      <span>🍄</span>
      <span>🌰</span>
      <span>🎃</span>
      <span>🐚</span>
      <span>🕸</span>
      <span>🌎</span>
      <span>🌍</span>
      <span>🌏</span>
      <span>🌕</span>
      <span>🌖</span>
      <span>🌗</span>
      <span>🌘</span>
      <span>🌑</span>
      <span>🌒</span>
      <span>🌓</span>
      <span>🌔</span>
      <span>🌚</span>
      <span>🌝</span>
      <span>🌛</span>
      <span>🌜</span>
      <span>🌞</span>
      <span>🌙</span>
      <span>⭐</span>
      <span>🌟</span>
      <span>💫</span>
      <span>✨</span>
      <span>🌤</span>
      <span>⛅</span>
      <span>🌥</span>
      <span>🌦</span>
      <span>🌧</span>
      <span>⛈</span>
      <span>🌩</span>
      <span>🔥</span>
      <span>💥</span>
      <span>🌨</span>
      <span>⛄</span>
      <span>🌬</span>
      <span>💨</span>
      <span>🌪</span>
      <span>🌫</span>
      <span>💧</span>
      <span>💦</span>
      <span>🌊</span>
    </div>
    <div data-react="food-and-drink" style="display:none" class="emoji-panel-tab-food-and-drink">
      <span>🍏</span>
      <span>🍎</span>
      <span>🍐</span>
      <span>🍊</span>
      <span>🍋</span>
      <span>🍌</span>
      <span>🍉</span>
      <span>🍇</span>
      <span>🍓</span>
      <span>🍈</span>
      <span>🍒</span>
      <span>🍑</span>
      <span>🍍</span>
      <span>🍅</span>
      <span>🍆</span>
      <span>🌶</span>
      <span>🌽</span>
      <span>🍠</span>
      <span>🍯</span>
      <span>🍞</span>
      <span>🧀</span>
      <span>🍗</span>
      <span>🍖</span>
      <span>🍤</span>
      <span>🍳</span>
      <span>🍔</span>
      <span>🍟</span>
      <span>🌭</span>
      <span>🍕</span>
      <span>🍝</span>
      <span>🌮</span>
      <span>🌯</span>
      <span>🍜</span>
      <span>🍲</span>
      <span>🍥</span>
      <span>🍣</span>
      <span>🍱</span>
      <span>🍛</span>
      <span>🍙</span>
      <span>🍚</span>
      <span>🍘</span>
      <span>🍢</span>
      <span>🍡</span>
      <span>🍧</span>
      <span>🍨</span>
      <span>🍦</span>
      <span>🍰</span>
      <span>🎂</span>
      <span>🍮</span>
      <span>🍬</span>
      <span>🍭</span>
      <span>🍫</span>
      <span>🍿</span>
      <span>🍩</span>
      <span>🍪</span>
      <span>🍺</span>
      <span>🍻</span>
      <span>🍷</span>
      <span>🍸</span>
      <span>🍹</span>
      <span>🍾</span>
      <span>🍶</span>
      <span>🍵</span>
      <span>🍼</span>
      <span>🍴</span>
      <span>🍽</span>
    </div>
    <div data-react="activity" style="display:none" class="emoji-panel-tab-activity">
      <span>⚽</span>
      <span>🏀</span>
      <span>🏈</span>
      <span>⚾</span>
      <span>🎾</span>
      <span>🏐</span>
      <span>🏉</span>
      <span>🎱</span>
      <span>⛳</span>
      <span>🏌</span>
      <span>🏓</span>
      <span>🏸</span>
      <span>🏒</span>
      <span>🏑</span>
      <span>🏏</span>
      <span>🎿</span>
      <span>⛷</span>
      <span>🏂</span>
      <span>⛸</span>
      <span>🏹</span>
      <span>🎣</span>
      <span>🚣</span>
      <span>🏊</span>
      <span>🏄</span>
      <span>🛀</span>
      <span>⛹</span>
      <span>🏋</span>
      <span>🚴</span>
      <span>🚵</span>
      <span>🏇</span>
      <span>🕴</span>
      <span>🏆</span>
      <span>🎽</span>
      <span>🏅</span>
      <span>🎖</span>
      <span>🎗</span>
      <span>🏵</span>
      <span>🎫</span>
      <span>🎟</span>
      <span>🎭</span>
      <span>🎨</span>
      <span>🎪</span>
      <span>🎤</span>
      <span>🎧</span>
      <span>🎼</span>
      <span>🎹</span>
      <span>🎷</span>
      <span>🎺</span>
      <span>🎸</span>
      <span>🎻</span>
      <span>🎬</span>
      <span>🎮</span>
      <span>👾</span>
      <span>🎯</span>
      <span>🎲</span>
      <span>🎰</span>
      <span>🎳</span>
    </div>
    <div data-react="travel-and-places" style="display:none" class="emoji-panel-tab-travel-and-places">
      <span>🚗</span>
      <span>🚕</span>
      <span>🚙</span>
      <span>🚌</span>
      <span>🚎</span>
      <span>🏎</span>
      <span>🚓</span>
      <span>🚑</span>
      <span>🚒</span>
      <span>🚐</span>
      <span>🚚</span>
      <span>🚛</span>
      <span>🚜</span>
      <span>🏍</span>
      <span>🚲</span>
      <span>🚨</span>
      <span>🚔</span>
      <span>🚍</span>
      <span>🚘</span>
      <span>🚖</span>
      <span>🚡</span>
      <span>🚠</span>
      <span>🚟</span>
      <span>🚃</span>
      <span>🚋</span>
      <span>🚝</span>
      <span>🚄</span>
      <span>🚅</span>
      <span>🚈</span>
      <span>🚞</span>
      <span>🚂</span>
      <span>🚆</span>
      <span>🚇</span>
      <span>🚊</span>
      <span>🚉</span>
      <span>🚁</span>
      <span>🛩</span>
      <span>🛫</span>
      <span>🛬</span>
      <span>⛵</span>
      <span>🛥</span>
      <span>🚤</span>
      <span>⛴</span>
      <span>🛳</span>
      <span>🚀</span>
      <span>🛰</span>
      <span>💺</span>
      <span>🚧</span>
      <span>⛽</span>
      <span>🚏</span>
      <span>🚦</span>
      <span>🚥</span>
      <span>🏁</span>
      <span>🚢</span>
      <span>🎡</span>
      <span>🎢</span>
      <span>🎠</span>
      <span>🏗</span>
      <span>🌁</span>
      <span>🗼</span>
      <span>🏭</span>
      <span>⛲</span>
      <span>🎑</span>
      <span>⛰</span>
      <span>🏔</span>
      <span>🗻</span>
      <span>🌋</span>
      <span>🗾</span>
      <span>🏕</span>
      <span>⛺</span>
      <span>🏞</span>
      <span>🛣</span>
      <span>🛤</span>
      <span>🌅</span>
      <span>🌄</span>
      <span>🏜</span>
      <span>🏖</span>
      <span>🏝</span>
      <span>🌇</span>
      <span>🌆</span>
      <span>🏙</span>
      <span>🌃</span>
      <span>🌉</span>
      <span>🌌</span>
      <span>🌠</span>
      <span>🎇</span>
      <span>🎆</span>
      <span>🌈</span>
      <span>🏘</span>
      <span>🏰</span>
      <span>🏯</span>
      <span>🏟</span>
      <span>🗽</span>
      <span>🏠</span>
      <span>🏡</span>
      <span>🏚</span>
      <span>🏢</span>
      <span>🏬</span>
      <span>🏣</span>
      <span>🏤</span>
      <span>🏥</span>
      <span>🏦</span>
      <span>🏨</span>
      <span>🏪</span>
      <span>🏫</span>
      <span>🏩</span>
      <span>💒</span>
      <span>🏛</span>
      <span>⛪</span>
      <span>🕌</span>
      <span>🕍</span>
      <span>🕋</span>
      <span>⛩</span>
    </div>
    <div data-react="objects" style="display:none" class="emoji-panel-tab-objects">
      <span>⌚</span>
      <span>📱</span>
      <span>📲</span>
      <span>💻</span>
      <span>🖥</span>
      <span>🖨</span>
      <span>🖱</span>
      <span>🖲</span>
      <span>🕹</span>
      <span>🗜</span>
      <span>💽</span>
      <span>💾</span>
      <span>💿</span>
      <span>📀</span>
      <span>📼</span>
      <span>📷</span>
      <span>📸</span>
      <span>📹</span>
      <span>🎥</span>
      <span>📽</span>
      <span>🎞</span>
      <span>📞</span>
      <span>📟</span>
      <span>📠</span>
      <span>📺</span>
      <span>📻</span>
      <span>🎙</span>
      <span>🎚</span>
      <span>🎛</span>
      <span>⏱</span>
      <span>⏲</span>
      <span>⏰</span>
      <span>🕰</span>
      <span>⏳</span>
      <span>⌛</span>
      <span>📡</span>
      <span>🔋</span>
      <span>🔌</span>
      <span>💡</span>
      <span>🔦</span>
      <span>🕯</span>
      <span>🗑</span>
      <span>🛢</span>
      <span>💸</span>
      <span>💵</span>
      <span>💴</span>
      <span>💶</span>
      <span>💷</span>
      <span>💰</span>
      <span>💳</span>
      <span>💎</span>
      <span>🔧</span>
      <span>🔨</span>
      <span>🛠</span>
      <span>⛏</span>
      <span>🔩</span>
      <span>⛓</span>
      <span>🔫</span>
      <span>💣</span>
      <span>🔪</span>
      <span>🗡</span>
      <span>🛡</span>
      <span>🚬</span>
      <span>🏺</span>
      <span>🔮</span>
      <span>📿</span>
      <span>💈</span>
      <span>🔭</span>
      <span>🔬</span>
      <span>🕳</span>
      <span>💊</span>
      <span>💉</span>
      <span>🌡</span>
      <span>🏷</span>
      <span>🔖</span>
      <span>🚽</span>
      <span>🚿</span>
      <span>🛁</span>
      <span>🔑</span>
      <span>🗝</span>
      <span>🛋</span>
      <span>🛌</span>
      <span>🛏</span>
      <span>🚪</span>
      <span>🛎</span>
      <span>🖼</span>
      <span>🗺</span>
      <span>⛱</span>
      <span>🗿</span>
      <span>🛍</span>
      <span>🎈</span>
      <span>🎏</span>
      <span>🎀</span>
      <span>🎁</span>
      <span>🎊</span>
      <span>🎉</span>
      <span>🎎</span>
      <span>🎐</span>
      <span>🎌</span>
      <span>🏮</span>
      <span>✉</span>
      <span>📩</span>
      <span>📨</span>
      <span>📧</span>
      <span>💌</span>
      <span>📮</span>
      <span>📪</span>
      <span>📫</span>
      <span>📬</span>
      <span>📭</span>
      <span>📦</span>
      <span>📯</span>
      <span>📥</span>
      <span>📤</span>
      <span>📜</span>
      <span>📃</span>
      <span>📑</span>
      <span>📊</span>
      <span>📈</span>
      <span>📉</span>
      <span>📄</span>
      <span>📅</span>
      <span>📆</span>
      <span>🗓</span>
      <span>📇</span>
      <span>🗃</span>
      <span>🗳</span>
      <span>🗄</span>
      <span>📋</span>
      <span>🗒</span>
      <span>📁</span>
      <span>📂</span>
      <span>🗂</span>
      <span>🗞</span>
      <span>📰</span>
      <span>📓</span>
      <span>📕</span>
      <span>📗</span>
      <span>📘</span>
      <span>📙</span>
      <span>📔</span>
      <span>📒</span>
      <span>📚</span>
      <span>📖</span>
      <span>🔗</span>
      <span>📎</span>
      <span>🖇</span>
      <span>📐</span>
      <span>📏</span>
      <span>📌</span>
      <span>📍</span>
      <span>🚩</span>
      <span>🏳</span>
      <span>🏴</span>
      <span>🔐</span>
      <span>🔒</span>
      <span>🔓</span>
      <span>🔏</span>
      <span>🖊</span>
      <span>🖋</span>
      <span>📝</span>
      <span>🖍</span>
      <span>🖌</span>
      <span>🔍</span>
      <span>🔎</span>
    </div>
    <div data-react="symbols" style="display:none" class="emoji-panel-tab-symbols">
      <span>💛</span>
      <span>💚</span>
      <span>💙</span>
      <span>💜</span>
      <span>💔</span>
      <span>💕</span>
      <span>💞</span>
      <span>💓</span>
      <span>💗</span>
      <span>💖</span>
      <span>💘</span>
      <span>💝</span>
      <span>💟</span>
      <span>🕉</span>
      <span>🔯</span>
      <span>🕎</span>
      <span>🛐</span>
      <span>⛎</span>
      <span>🆔</span>
      <span>🈳</span>
      <span>🈹</span>
      <span>📴</span>
      <span>📳</span>
      <span>🈶</span>
      <span>🈚</span>
      <span>🈸</span>
      <span>🈺</span>
      <span>🆚</span>
      <span>🉑</span>
      <span>💮</span>
      <span>🉐</span>
      <span>🈴</span>
      <span>🈵</span>
      <span>🈲</span>
      <span>🆎</span>
      <span>🆑</span>
      <span>🆘</span>
      <span>⛔</span>
      <span>📛</span>
      <span>🚫</span>
      <span>❌</span>
      <span>⭕</span>
      <span>💢</span>
      <span>🚷</span>
      <span>🚯</span>
      <span>🚳</span>
      <span>🚱</span>
      <span>🔞</span>
      <span>📵</span>
      <span>❗</span>
      <span>❕</span>
      <span>❓</span>
      <span>❔</span>
      <span>💯</span>
      <span>🔅</span>
      <span>🔆</span>
      <span>🔱</span>
      <span>🚸</span>
      <span>🔰</span>
      <span>🈯</span>
      <span>💹</span>
      <span>❎</span>
      <span>✅</span>
      <span>💠</span>
      <span>🌀</span>
      <span>➿</span>
      <span>🌐</span>
      <span>🏧</span>
      <span>🛂</span>
      <span>🛃</span>
      <span>🛄</span>
      <span>🛅</span>
      <span>🚭</span>
      <span>🚾</span>
      <span>🚰</span>
      <span>🚹</span>
      <span>🚺</span>
      <span>🚼</span>
      <span>🚻</span>
      <span>🚮</span>
      <span>🎦</span>
      <span>📶</span>
      <span>🈁</span>
      <span>🆖</span>
      <span>🆗</span>
      <span>🆙</span>
      <span>🆒</span>
      <span>🆕</span>
      <span>🆓</span>
      <span>🔟</span>
      <span>🔢</span>
      <span>⏸</span>
      <span>⏯</span>
      <span>⏹</span>
      <span>⏺</span>
      <span>⏭</span>
      <span>⏮</span>
      <span>⏩</span>
      <span>⏪</span>
      <span>🔀</span>
      <span>🔁</span>
      <span>🔂</span>
      <span>🔼</span>
      <span>🔽</span>
      <span>⏫</span>
      <span>⏬</span>
      <span>🔤</span>
      <span>🔡</span>
      <span>🔠</span>
      <span>🔣</span>
      <span>🎵</span>
      <span>🎶</span>
      <span>➰</span>
      <span>🔃</span>
      <span>➕</span>
      <span>➖</span>
      <span>➗</span>
      <span>💲</span>
      <span>💱</span>
      <span>🔚</span>
      <span>🔙</span>
      <span>🔛</span>
      <span>🔝</span>
      <span>🔜</span>
      <span>🔘</span>
      <span>⚪</span>
      <span>⚫</span>
      <span>🔴</span>
      <span>🔵</span>
      <span>🔶</span>
      <span>🔷</span>
      <span>🔺</span>
      <span>⬛</span>
      <span>⬜</span>
      <span>🔻</span>
      <span>🔲</span>
      <span>🔳</span>
      <span>🔈</span>
      <span>🔉</span>
      <span>🔊</span>
      <span>🔇</span>
      <span>📣</span>
      <span>📢</span>
      <span>🔔</span>
      <span>🔕</span>
      <span>🃏</span>
      <span>🀄</span>
      <span>🎴</span>
      <span>🗨</span>
      <span>💭</span>
      <span>🗯</span>
      <span>💬</span>
      <span>🕐</span>
      <span>🕑</span>
      <span>🕒</span>
      <span>🕓</span>
      <span>🕔</span>
      <span>🕕</span>
      <span>🕖</span>
      <span>🕗</span>
      <span>🕘</span>
      <span>🕙</span>
      <span>🕚</span>
      <span>🕛</span>
      <span>🕜</span>
      <span>🕝</span>
      <span>🕞</span>
      <span>🕟</span>
      <span>🕠</span>
      <span>🕡</span>
      <span>🕢</span>
      <span>🕣</span>
      <span>🕤</span>
      <span>🕥</span>
      <span>🕦</span>
      <span>🕧</span>
    </div>
  </div>
  </div>
</div>
  <div class="stories-chat-item-replied-textarea do-chat-main w-100 d-flex align-self-center" style="margin-top:0;box-shadow:none">
      <input type="text" id="txtArea" name="txtArea" #txtArea class="form-control signUpInput txtArea"  trim="blur" formControlName="txtArea" 
      data-item-id="${get(item, 'id')}" style="border-radius:30px !important;height:42px" placeholder='${option('language', 'msg')}'>
      <div id="emoji_div" class="upload-btn-wrapper align-self-center emoji-selector-show-hide" style="margin:0 10px;">
         <img id="emoji_img" src="assets/img/smile.svg" style="margin-left:0">
      </div>
        <div class="upload-btn-wrapper-msg-send align-self-center">
            <button id='BTN_Submit_Comment' #BTN_Submit_Comment  type="button" class="btn pt-0 pb-0 pl-0 pr-1">
                <img id='IMG_Submit_Comment' #IMG_Submit_Comment src="assets/img/sendmsgbtn.svg" style="width: 40px;
                height: 40px;">
            </button>
        </div>
    </div>
  </div>`}
<div class="story-right" id="story-right"  title="Next Story">
              <svg id="story-right1" class="story-right1" xmlns="http://www.w3.org/2000/svg" width="11.486" height="20.861" viewBox="0 0 11.486 20.861" style="&#10;  
              height: 30px;&#10;    width: 30px;&#10;"><g class="story-right2" id="story-right2" transform="translate(0 0)">
              <path class="story-right3" id="story-right3" style="fill:white" d="M65.294,11.176l-9.381,9.378a1.053,1.053,0,0,1-1.491-1.488l8.637-8.634L54.423,1.8A1.054,
              1.054,0,0,1,55.914.309L65.3,9.687A1.063,1.063,0,0,1,65.294,11.176Z" transform="translate(-54.113 -0.001)"/>
              </g></svg></div>
</div>`;
        }
      },
      language: {
        unmute: 'Touch to unmute',
        mute: 'Touch to mute',
        msg: 'Send Message',
        keyboardTip: 'Press space to see next',
        visitLink: 'Visit link',
        time: {
          ago: 'ago',
          hour: 'hour ago',
          hours: 'hours ago',
          minute: 'minute ago',
          minutes: 'minutes ago',
          fromnow: 'from now',
          seconds: 'seconds ago',
          yesterday: 'yesterday',
          tomorrow: 'tomorrow',
          days: 'days ago'
        }
      }
    };

    /* modal */
    const ZuckModal = () => {
      let modalZuckContainer = query('#zuck-modal');

      if (!modalZuckContainer && !zuck.hasModal) {
        zuck.hasModal = true;

        modalZuckContainer = document.createElement('div');
        modalZuckContainer.id = 'zuck-modal';

        if (option('cubeEffect')) {
          modalZuckContainer.className = 'with-cube';
        }

        modalZuckContainer.innerHTML = '<div id="zuck-modal-content"></div>';
        modalZuckContainer.style.display = 'none';

        modalZuckContainer.setAttribute('tabIndex', '1');
        modalZuckContainer.onkeyup = ({
          keyCode
        }) => {
          const code = keyCode;

          if (code === 27) {
            modal.close();
          }
        };

        if (option('openEffect')) {
          modalZuckContainer.classList.add('with-effects');
        }

        if (option('rtl')) {
          modalZuckContainer.classList.add('rtl');
        }

        onTransitionEnd(modalZuckContainer, () => {
          if (modalZuckContainer.classList.contains('closed')) {
            modalContent.innerHTML = '';
            modalZuckContainer.style.display = 'none';
            modalZuckContainer.classList.remove('closed');
            modalZuckContainer.classList.remove('animated');
          }
        });

        document.body.appendChild(modalZuckContainer);
      }

      const modalContent = query('#zuck-modal-content');

      const moveStoryItem = function (direction) {
        const modalContainer = query('#zuck-modal');
        let target = '';
        let useless = '';
        let transform = 0;

        const modalSlider = query(`#zuck-modal-slider-${id}`);
        const slideItems = {
          previous: query('#zuck-modal .story-viewer.previous'),
          next: query('#zuck-modal .story-viewer.next'),
          viewing: query('#zuck-modal .story-viewer.viewing')
        };

        if (
          (!slideItems.previous && !direction) ||
          (!slideItems.next && direction)
        ) {
          if (!option('rtl')) {
            return false;
          }
        }

        if (!direction) {
          target = 'previous';
          useless = 'next';
        } else {
          target = 'next';
          useless = 'previous';
        }

        const transitionTime = 600;
        if (option('cubeEffect')) {
          if (target === 'previous') {
            transform = modalContainer.slideWidth;
          } else if (target === 'next') {
            transform = modalContainer.slideWidth * -1;
          }
        } else {
          transform = findPos(slideItems[target])[0] * -1;
        }

        translate(modalSlider, transform, transitionTime, null);

        setTimeout(() => {
          // set page data when transition complete
          if (option('rtl')) {
            const tmp = target;
            target = useless;
            useless = tmp;
          }

          if (target !== '' && slideItems[target] && useless !== '') {
            const currentStory = slideItems[target].getAttribute('data-story-id');
            zuck.internalData.currentStory = currentStory;
            const oldStory = query(`#zuck-modal .story-viewer.${useless}`);
            if (oldStory) {
              oldStory.parentNode.removeChild(oldStory);
            }

            if (slideItems.viewing) {
              slideItems.viewing.classList.add('stopped');
              slideItems.viewing.classList.add(useless);
              slideItems.viewing.classList.remove('viewing');
            }

            if (slideItems[target]) {
              slideItems[target].classList.remove('stopped');
              slideItems[target].classList.remove(target);
              slideItems[target].classList.add('viewing');
            }

            const newStoryData = getStoryMorningGlory(target);
            if (newStoryData) {
              createStoryViewer(newStoryData, target);
            }

            const storyId = zuck.internalData.currentStory;
            let items = query(`#zuck-modal [data-story-id="${storyId}"]`);

            if (items) {
              items = items.querySelectorAll('[data-index].active');
              const duration = items[0].firstElementChild;
              zuck.data[storyId].currentItem = parseInt(
                items[0].getAttribute('data-index'),
                10
              );

              items[0].innerHTML =
                `<b style="${duration.style.cssText}"></b>`;
              onAnimationEnd(items[0].firstElementChild, () => {
                zuck.nextItem(false);
              });
            }

            translate(modalSlider, '0', 0, null);

            if (items) {
              const storyViewer = query(`#zuck-modal .story-viewer[data-story-id="${currentStory}"]`);

              playVideoItem(storyViewer, [items[0], items[1]], true);
            }
            zuck.sendViewItemUpdate();
            option('callbacks', 'onView')(zuck.internalData.currentStory);
          }
        }, transitionTime + 50);
      };

      const createStoryViewer = function (storyData, className, forcePlay) {
        const modalSlider = query(`#zuck-modal-slider-${id}`);
        const storyItems = get(storyData, 'items');

        storyData.timeAgo = storyItems && storyItems[0] ? timeAgo(get(storyItems[0], 'time')) : '';

        let htmlItems = '';
        let pointerItems = '';

        const storyId = get(storyData, 'id');
        const slides = document.createElement('div');
        const currentItem = get(storyData, 'currentItem') || 0;
        let continueStoryIndex;
        continueStoryIndex = storyData.items.findIndex((x) => !x.isStorySeen);
        if (continueStoryIndex < 0) {
          continueStoryIndex = storyData.items.length - 1;
        } else {
          continueStoryIndex = continueStoryIndex;
        }
        const exists = query(`#zuck-modal .story-viewer[data-story-id="${storyId}"]`);
        if (exists) {
          return false;
        }

        slides.className = 'slides';

        each(storyItems, (i, item) => {
          item.timeAgo = timeAgo(get(item, 'time'));
          if (continueStoryIndex > i) {
            storyData.items[i].timeAgo = item.timeAgo;
            storyData.items[i].seen = true;
            storyData.items[i].isStorySeen = true;
            item.seen = true;
            item.isStorySeen = true;
          }
          pointerItems += option('template', 'viewerItemPointer')(i, continueStoryIndex, item);
          htmlItems += option('template', 'viewerItemBody')(i, continueStoryIndex, item);
        });

        slides.innerHTML = htmlItems;

        const video = slides.querySelector('video');
        const addMuted = function (video) {
          if (video.muted) {
            storyViewer.classList.add('muted');
          } else {
            storyViewer.classList.remove('muted');
          }
        };

        if (video) {
          video.onwaiting = e => {
            if (video.paused) {
              storyViewer.classList.add('paused');
              storyViewer.classList.add('loading');
            }
          };

          video.onplay = () => {
            addMuted(video);
            storyViewer.classList.remove('stopped');
            storyViewer.classList.remove('paused');
            storyViewer.classList.remove('loading');
          };

          video.onload = video.onplaying = video.oncanplay = () => {
            addMuted(video);
            storyViewer.classList.remove('loading');
          };

          video.onvolumechange = () => {
            addMuted(video);
          };
        }

        const storyViewerWrap = document.createElement('div');
        storyViewerWrap.innerHTML = option('template', 'viewerItem')(storyData, currentItem);
        const storyViewer = storyViewerWrap.firstElementChild;

        storyViewer.className = `story-viewer muted ${className} ${!forcePlay ? 'stopped' : ''} ${option('backButton') ? 'with-back-button' : ''}`;

        storyViewer.setAttribute('data-story-id', storyId);
        storyViewer.querySelector('.slides-pointers .wrap').innerHTML = pointerItems;

        each(storyViewer.querySelectorAll('.close, .back, .viewID'), (i, el) => {
          el.onclick = e => {
            if (el.className === "viewID") {
              let elements = document.getElementsByClassName('s-v-block');
              for (let index = 0; index < elements.length; index++) {
                if (elements[index].style.display === "none") {
                  elements[index].style.display = "block";
                  document.getElementById("open_eye").setAttribute('viewBox', '0 0 18 18')
                  document.getElementById("open_eye").innerHTML = `<path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7.028 7.028 0 0 0-2.79.588l.77.771A5.944 5.944 0 0 1 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.134 13.134 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755-.165.165-.337.328-.517.486l.708.709z" style="fill: #fff;"/>
                  <path d="M11.297 9.176a3.5 3.5 0 0 0-4.474-4.474l.823.823a2.5 2.5 0 0 1 2.829 2.829l.822.822zm-2.943 1.299.822.822a3.5 3.5 0 0 1-4.474-4.474l.823.823a2.5 2.5 0 0 0 2.829 2.829z" style="fill: #fff;"/>
                  <path d="M3.35 5.47c-.18.16-.353.322-.518.487A13.134 13.134 0 0 0 1.172 8l.195.288c.335.48.83 1.12 1.465 1.755C4.121 11.332 5.881 12.5 8 12.5c.716 0 1.39-.133 2.02-.36l.77.772A7.029 7.029 0 0 1 8 13.5C3 13.5 0 8 0 8s.939-1.721 2.641-3.238l.708.709zm10.296 8.884-12-12 .708-.708 12 12-.708.708z" style="fill: #fff;"/>`;
                } else {
                  elements[index].style.display = "none";
                  document.getElementById("open_eye").setAttribute('viewBox', '0 0 24 24')
                  document.getElementById("open_eye").innerHTML =
                    `<path d="M12.015 7c4.751 0 8.063 3.012 9.504 4.636-1.401 1.837-4.713 5.364-9.504 5.364-4.42 0-7.93-3.536-9.478-5.407 1.493-1.647 4.817-4.593 9.478-4.593zm0-2c-7.569 0-12.015 6.551-12.015 6.551s4.835 7.449 12.015 7.449c7.733 0 11.985-7.449 11.985-7.449s-4.291-6.551-11.985-6.551zm-.015 3c-2.209 0-4 1.792-4 4 0 2.209 1.791 4 4 4s4-1.791 4-4c0-2.208-1.791-4-4-4z" style="fill: #fff;"/>`;
                }
              }
            } else {
              e.preventDefault();
              modal.close();
              if(el.className === "close"){
                window.location.reload();
              }
            }
          };
        });

        storyViewer.appendChild(slides);

        if (className === 'viewing') {
          playVideoItem(storyViewer, storyViewer.querySelectorAll(`[data-index="${currentItem}"].active`), false);
        }

        each(storyViewer.querySelectorAll('.slides-pointers [data-index] > b'), (i, el) => {
          onAnimationEnd(el, () => {
            zuck.nextItem(false);
          });
        });

        if (className === 'previous') {
          prepend(modalSlider, storyViewer);
        } else {
          modalSlider.appendChild(storyViewer);
        }
      };

      const createStoryTouchEvents = function (modalSliderElement) {
        const modalContainer = query('#zuck-modal');
        const enableMouseEvents = true;

        const modalSlider = modalSliderElement;

        let position = {};
        let touchOffset = null;
        let isScrolling = null;
        let delta = null;
        let timer = null;
        let nextTimer = null;

        const touchStart = function (event) {
          const storyViewer = query('#zuck-modal .viewing');
          if (event.target.nodeName === 'A') {
            return;
          }

          const touches = event.touches ? event.touches[0] : event;
          const pos = findPos(query('#zuck-modal .story-viewer.viewing'));

          modalContainer.slideWidth = query('#zuck-modal .story-viewer').offsetWidth;
          modalContainer.slideHeight = query('#zuck-modal .story-viewer').offsetHeight;

          position = {
            x: pos[0],
            y: pos[1]
          };

          const clientX = touches.clientX;
          const clientY = touches.clientY;

          touchOffset = {
            x: clientX,
            y: clientY,
            time: Date.now(),
            valid: true
          };

          if (clientY < 80 || clientY > (modalContainer.slideHeight - 80)) {
            touchOffset.valid = false;
          } else {
            event.preventDefault();

            isScrolling = undefined;
            delta = {};

            if (enableMouseEvents) {
              modalSlider.addEventListener('mousemove', touchMove);
              modalSlider.addEventListener('mouseup', touchEnd);
              modalSlider.addEventListener('mouseleave', touchEnd);
            }
            modalSlider.addEventListener('touchmove', touchMove);
            modalSlider.addEventListener('touchend', touchEnd);

            if (storyViewer) {
              storyViewer.classList.add('paused');
            }

            pauseVideoItem();

            timer = setTimeout(() => {
              storyViewer.classList.add('longPress');
            }, 600);

            nextTimer = setTimeout(() => {
              clearInterval(nextTimer);
              nextTimer = false;
            }, 250);
          }
        };

        const touchMove = function (event) {
          const touches = event.touches ? event.touches[0] : event;
          const clientX = touches.clientX;
          const clientY = touches.clientY;

          if (touchOffset && touchOffset.valid) {
            delta = {
              x: clientX - touchOffset.x,
              y: clientY - touchOffset.y
            };

            if (typeof isScrolling === 'undefined') {
              isScrolling = !!(
                isScrolling || Math.abs(delta.x) < Math.abs(delta.y)
              );
            }

            if (!isScrolling && touchOffset) {
              event.preventDefault();

              translate(modalSlider, position.x + delta.x, 0, null);
            }
          }
        };

        modalSlider.addEventListener('click', function (e) {
          if (e.target.className == 'story-right' || e.target.className == 'story-right1' || e.target.className == 'story-right2' || e.target.className == 'story-right3') {
            zuck.navigateItem('next', event)
          }
          if (e.target.className == 'story-left' || e.target.className == 'story-left1' || e.target.className == 'story-left2' || e.target.className == 'story-left3') {
            if (zuck.data[zuck.internalData.currentStory].currentItem == 0) {
              moveStoryItem();
            } else {
              zuck.navigateItem('previous', event);
              zuck.internalData["currentVideoElement"].currentTime = 0;
            }
          }
        });

        const touchEnd = function (event) {
          const storyViewer = query('#zuck-modal .viewing');
          const lastTouchOffset = touchOffset;

          const duration = touchOffset ? Date.now() - touchOffset.time : undefined;
          const isValid = (Number(duration) < 300 && Math.abs(delta.x) > 25) || Math.abs(delta.x) > modalContainer.slideWidth / 3;
          const direction = delta.x < 0;

          const index = direction ? query('#zuck-modal .story-viewer.next') : query('#zuck-modal .story-viewer.previous');
          const isOutOfBounds = (direction && !index) || (!direction && !index);

          if (touchOffset && !touchOffset.valid) {

          } else {
            if (delta) {
              if (!isScrolling) {
                if (isValid && !isOutOfBounds) {
                  moveStoryItem(direction);
                } else {
                  translate(modalSlider, position.x, 300);
                }
              }

              touchOffset = undefined;

              if (enableMouseEvents) {
                modalSlider.removeEventListener('mousemove', touchMove);
                modalSlider.removeEventListener('mouseup', touchEnd);
                modalSlider.removeEventListener('mouseleave', touchEnd);
              }
              modalSlider.removeEventListener('touchmove', touchMove);
              modalSlider.removeEventListener('touchend', touchEnd);
            }

            const video = zuck.internalData.currentVideoElement;

            if (timer) {
              clearInterval(timer);
            }

            if (storyViewer) {
              playVideoItem(storyViewer, storyViewer.querySelectorAll('.active'), false);
              storyViewer.classList.remove('longPress');
              storyViewer.classList.remove('paused');
            }

            if (nextTimer) {
              clearInterval(nextTimer);
              nextTimer = false;

              const navigateItem = function () {
                if (event.target.id != 'videoTag' && event.target.id != 'videoMute' && event.target.id != 'videoUNMute' && event.target.className != 'story-left' && event.target.className != 'story-right' && event.target.className != 'story-left1' && event.target.className != 'story-right1' && event.target.className != 'story-left2' && event.target.className != 'story-right2' && event.target.className != 'story-left3' && event.target.className != 'story-right3' && event.target.parentElement.className != 'emoji-header menu-tabs hor-flex-parent' && event.target.parentElement.className != "emoji-panel-tab-smileys-and-people" && event.target.parentElement.className != "emoji-panel-tab-animals-and-nature" && event.target.parentElement.className != "emoji-panel-tab-food-and-drink" && event.target.parentElement.className != "emoji-panel-tab-activity" && event.target.parentElement.className != "emoji-panel-tab-travel-and-places" && event.target.parentElement.className != "emoji-panel-tab-objects" && event.target.parentElement.className != "emoji-panel-tab-symbols" && event.target.parentElement.className != "emoji-panel-tab-flags" && event.target.parentElement.className != "emoji-panel") {
                  if (!direction) {
                    if (lastTouchOffset.x > window.screen.availWidth / 3 || !option('previousTap')) {
                      if (option('rtl')) {
                        zuck.navigateItem('previous', event);
                      } else {
                        zuck.navigateItem('next', event);
                      }
                    } else {
                      if (option('rtl')) {
                        zuck.navigateItem('next', event);
                      } else {
                        zuck.navigateItem('previous', event);
                      }
                    }
                  }
                }
                if (window.innerWidth <= 1300 && window.innerHeight <= 1400) {
                  if (event.target.className == 'story-right' || event.target.className == 'story-right1' || event.target.className == 'story-right2' || event.target.className == 'story-right3') {
                    zuck.navigateItem('next', event)
                  }
                  if (event.target.className == 'story-left' || event.target.className == 'story-left1' || event.target.className == 'story-left2' || event.target.className == 'story-left3') {
                    if (zuck.data[zuck.internalData.currentStory].currentItem == 0) {
                      moveStoryItem();
                    } else {
                      zuck.navigateItem('previous', event);
                      zuck.internalData["currentVideoElement"].currentTime = 0;
                    }
                  }
                }
              };

              const storyViewerViewing = query('#zuck-modal .viewing');

              if (storyViewerViewing && video) {
                if (storyViewerViewing.classList.contains('muted') && event.target.id != 'videoTag' && event.target.id != 'videoMute' && event.target.id != 'videoUNMute' && event.target.id != 'story-left' && event.target.id != 'story-right' && event.target.id != 'story-left1' && event.target.id != 'story-right1' && event.target.id != 'story-left2' && event.target.id != 'story-right2' && event.target.id != 'story-left3' && event.target.id != 'story-right3' && event.target.parentElement.className != 'emoji-header menu-tabs hor-flex-parent' && event.target.parentElement.className != "emoji-panel-tab-smileys-and-people" && event.target.parentElement.className != "emoji-panel-tab-animals-and-nature" && event.target.parentElement.className != "emoji-panel-tab-food-and-drink" && event.target.parentElement.className != "emoji-panel-tab-activity" && event.target.parentElement.className != "emoji-panel-tab-travel-and-places" && event.target.parentElement.className != "emoji-panel-tab-objects" && event.target.parentElement.className != "emoji-panel-tab-symbols" && event.target.parentElement.className != "emoji-panel-tab-flags" && event.target.parentElement.className != "emoji-panel") {

                } else {
                  navigateItem();
                }
              } else {
                navigateItem();

                return false;
              }
            }
          }
        };

        modalSlider.addEventListener('touchstart', touchStart);
        if (enableMouseEvents) {
          modalSlider.addEventListener('mousedown', touchStart);
        }
      };

      return {
        show(storyId, page) {
          const modalContainer = query('#zuck-modal');

          const callback = function () {
            modalContent.innerHTML = `<div id="zuck-modal-slider-${id}" class="slider"></div>`;

            const storyData = zuck.data[storyId];
            const currentItem = storyData.currentItem || 0;
            let continueStoryIndex;
            continueStoryIndex = storyData.items.findIndex((x) => !x.isStorySeen);
            if (continueStoryIndex < 0) {
              continueStoryIndex = storyData.items.length - 1;
            } else {
              continueStoryIndex = continueStoryIndex;
            }
            const modalSlider = query(`#zuck-modal-slider-${id}`);

            createStoryTouchEvents(modalSlider);

            zuck.internalData.currentStory = storyId;
            storyData.currentItem = continueStoryIndex;

            if (option('backNative')) {
              window.location.hash = `#!${id}`;
            }

            const previousItemData = getStoryMorningGlory('previous');
            if (previousItemData) {
              createStoryViewer(previousItemData, 'previous');
            }

            createStoryViewer(storyData, 'viewing', true);

            const nextItemData = getStoryMorningGlory('next');
            if (nextItemData) {
              createStoryViewer(nextItemData, 'next');
            }

            if (option('autoFullScreen')) {
              modalContainer.classList.add('fullscreen');
            }

            const tryFullScreen = function () {
              if (
                modalContainer.classList.contains('fullscreen') &&
                option('autoFullScreen') &&
                window.screen.availWidth <= 1024
              ) {
                fullScreen(modalContainer);
              }

              modalContainer.focus();
            };

            if (option('openEffect')) {
              const storyEl = query(
                `#${id} [data-id="${storyId}"] .item-preview`
              );
              const pos = findPos(storyEl);

              modalContainer.style.marginLeft = `${pos[0] + storyEl.offsetWidth / 2}px`;
              modalContainer.style.marginTop = `${pos[1] + storyEl.offsetHeight / 2}px`;
              modalContainer.style.display = 'block';

              modalContainer.slideWidth = query('#zuck-modal .story-viewer').offsetWidth;

              setTimeout(() => {
                modalContainer.classList.add('animated');
              }, 10);

              setTimeout(() => {
                tryFullScreen();
              }, 300); // because effects
            } else {
              modalContainer.style.display = 'block';
              modalContainer.slideWidth = query('#zuck-modal .story-viewer').offsetWidth;

              tryFullScreen();
            }
            option('callbacks', 'onView')(storyId);
          };

          option('callbacks', 'onOpen')(storyId, callback);
        },
        next(unmute) {
          const callback = function () {
            const lastStory = zuck.internalData.currentStory;
            const lastStoryTimelineElement = query(
              `#${id} [data-id="${lastStory}"]`
            );

            if (lastStoryTimelineElement) {
              lastStoryTimelineElement.classList.add('seen');

              zuck.data[lastStory].seen = true;
              zuck.internalData.seenItems[lastStory] = true;

              saveLocalData('seenItems', zuck.internalData.seenItems);
            }

            const stories = query('#zuck-modal .story-viewer.next');
            if (!stories) {
              modal.close();
            } else {
              if (option('rtl')) {
                moveStoryItem(false);
              } else {
                moveStoryItem(true);
              }
            }
          };

          option('callbacks', 'onEnd')(
            zuck.internalData.currentStory,
            callback
          );
        },
        close() {
          const modalContainer = query('#zuck-modal');
          const callback = function () {
            if (option('backNative')) {
              window.location.hash = '';
            }

            fullScreen(modalContainer, true);

            if (option('openEffect')) {
              modalContainer.classList.add('closed');
            } else {
              modalContent.innerHTML = '';
              modalContainer.style.display = 'none';
            }
          };
          option('callbacks', 'onClose')(zuck.internalData.currentStory, callback);
        }
      };
    };

    const modal = ZuckModal();

    /* parse functions */
    const parseItems = function (story, forceUpdate, storyData) {
      const storyId = story.getAttribute('data-id');
      const storyItems = document.querySelectorAll(`#${id} [data-id="${storyId}"] .items > li`);
      const items = [];
      // zuck.data[storyId].items= [];
      if (!option('reactive') || forceUpdate) {
        each(storyItems, (i, {
          firstElementChild
        }) => {
          const a = firstElementChild;
          const img = a.firstElementChild;
          const item = {
            id: storyData.id,
            src: storyData.src,
            length: storyData.length,
            type: storyData.type,
            time: storyData.time,
            link: storyData.link,
            linkText: storyData.linkText,
            viewersDetails: storyData.viewersDetails,
            totalViewCount: +storyData.totalViewCount,
            preview: storyData.preview,
            isSubscribed: storyData.isSubscribed,
            isFavouriteAdded: storyData.isFavouriteAdded,
            isStorySeen: storyData.seen,
            ownStory: story.getAttribute('data-own-story')
          };
          const data = zuck.data[storyId].items;
          const findAlreadExist = data.find((x) => x.id === item.id);
          zuck.data[storyId].items = !findAlreadExist ? [...zuck.data[storyId].items, item] : zuck.data[storyId].items;

          // collect all attributes
          const all = a.attributes;
          // exclude the reserved options
          const reserved = ['data-id', 'href', 'viewersDetails', 'totalViewCount', 'ownStory', 'data-length', 'data-type', 'data-time', 'data-link', 'data-linktext'];
          for (let z = 0; z < all.length; z++) {
            if (reserved.indexOf(all[z].nodeName) === -1) {
              item[all[z].nodeName.replace('data-', '')] = all[z].nodeValue;
            }
          }
          // destruct the remaining attributes as options
        });
        const callback = option('callbacks', 'onDataUpdate');
        if (callback) {
          callback(zuck.data, () => {});
        }
      }
    };

    const parseStory = function (story, returnCallback) {
      const storyId = story.getAttribute('data-id');

      let seen = false;

      if (zuck.internalData.seenItems[storyId]) {
        seen = true;
      }

      /*
REACT
if (seen) {
story.classList.add('seen');
} else {
story.classList.remove('seen');
}
*/

      try {
        if (!zuck.data[storyId]) {
          zuck.data[storyId] = {};
        }

        zuck.data[storyId].id = storyId; // story id
        zuck.data[storyId].photo = story.getAttribute('data-photo'); // story preview (or user photo)
        zuck.data[storyId].name = story.querySelector('.name').innerText;
        zuck.data[storyId].link = story.querySelector('.item-link').getAttribute('href');
        zuck.data[storyId].lastUpdated = story.getAttribute('data-last-updated');
        zuck.data[storyId].ownStory = story.getAttribute('data-own-story');
        zuck.data[storyId].seen = seen;

        if (!zuck.data[storyId].items) {
          zuck.data[storyId].items = [];
          zuck.data[storyId].noItems = true;
        }
      } catch (e) {
        zuck.data[storyId] = {
          items: []
        };
      }

      story.onclick = e => {
        e.preventDefault();
        modal.show(storyId);
        setTimeout(() => {
          zuck.sendViewItemUpdate();
        }, 300);
      };

      const callback = option('callbacks', 'onDataUpdate');
      if (callback) {
        callback(zuck.data, () => {});
      }
    };

    // BIBLICAL
    const getStoryMorningGlory = function (what) {

      const currentStory = zuck.internalData.currentStory;
      const whatElementYouMean = `${what}ElementSibling`;
      const data_stories = query(`#${id} [data-id="${currentStory}"]`)
      if (currentStory && data_stories) {
        const foundStory = query(`#${id} [data-id="${currentStory}"]`)[whatElementYouMean];
        if (foundStory) {
          const storyId = foundStory.getAttribute('data-id');
          const data = zuck.data[storyId] || false;
          return data;
        }
      }

      return false;
    };

    const updateStorySeenPosition = function () {
      each(document.querySelectorAll(`#${id} .story.seen`), (i, el) => {
        const newData = zuck.data[el.getAttribute('data-id')];
        const timeline = el.parentNode;
        if (!option('reactive')) {
          timeline.removeChild(el);
        }
        if(newData){
          zuck.update(newData, true);
        }
      });
    };

    const playVideoItem = function (storyViewer, elements, unmute) {
      const itemElement = elements[1];
      const itemPointer = elements[0];

      if (!itemElement || !itemPointer) {
        return false;
      }

      const cur = zuck.internalData.currentVideoElement;
      if (cur) {
        if(!cur.paused){
          cur.pause();
        }
      }

      if (itemElement.getAttribute('data-type') === 'video') {
        const video = itemElement.getElementsByTagName('video')[0];
        if (!video) {
          zuck.internalData.currentVideoElement = false;

          return false;
        }

        const setDuration = function () {
          if (video.duration) {
            setVendorVariable(
              itemPointer.getElementsByTagName('b')[0].style,
              'AnimationDuration',
              `${video.duration}s`
            );
          }
        };

        setDuration();
        video.addEventListener('loadedmetadata', setDuration);
        zuck.internalData.currentVideoElement = video;

        video.play();

        if (unmute && unmute.target) {
        }
      } else {
        zuck.internalData.currentVideoElement = false;
      }
    };

    const pauseVideoItem = function () {
      const video = zuck.internalData.currentVideoElement;
      if (video) {
        try {
          if(!video.paused){
            if (event.target.id != 'videoTag' && event.target.id != 'videoMute' && event.target.id != 'videoUNMute' && event.target.className != 'story-left' && event.target.className != 'story-right' && event.target.className != 'story-left1' && event.target.className != 'story-right1' && event.target.className != 'story-left2' && event.target.className != 'story-right2' && event.target.className != 'story-left3' && event.target.className != 'story-right3' && event.target.parentElement.className != 'emoji-header menu-tabs hor-flex-parent' && event.target.parentElement.className != "emoji-panel-tab-smileys-and-people" && event.target.parentElement.className != "emoji-panel-tab-animals-and-nature" && event.target.parentElement.className != "emoji-panel-tab-food-and-drink" && event.target.parentElement.className != "emoji-panel-tab-activity" && event.target.parentElement.className != "emoji-panel-tab-travel-and-places" && event.target.parentElement.className != "emoji-panel-tab-objects" && event.target.parentElement.className != "emoji-panel-tab-symbols" && event.target.parentElement.className != "emoji-panel-tab-flags" && event.target.parentElement.className != "emoji-panel") {
            video.pause();
            }
          }
        } catch (e) {}
      }
    };

    const unmuteVideoItem = function (video, storyViewer) {
      video.muted = false;
      video.volume = 1.0;
      video.removeAttribute('muted');
      video.play();

      if (video.paused) {
        video.muted = true;
        video.play();
      }

      if (storyViewer) {
        storyViewer.classList.remove('paused');
      }
    };

    /* data functions */
    const saveLocalData = function (key, data) {
      try {
        if (option('localStorage')) {
          const keyName = `zuck-${id}-${key}`;
          window.localStorage[keyName] = JSON.stringify(data);
        }
      } catch (e) {}
    };

    const getLocalData = function (key) {
      if (option('localStorage')) {
        const keyName = `zuck-${id}-${key}`;

        return window.localStorage[keyName] ?
          JSON.parse(window.localStorage[keyName]) :
          false;
      } else {
        return false;
      }
    };

    /* api */
    zuck.data = option('stories') || {};
    zuck.internalData = {};
    zuck.internalData.seenItems = getLocalData('seenItems') || {};

    zuck.add = zuck.update = (data, append) => {
      if(data){
        const storyId = get(data, 'id');
        const storyEl = query(`#${id} [data-id="${storyId}"]`);
        const items = get(data, 'items');
        let story;
        let preview = false;
  
        if (items[items.length - 1]) {
          preview = items[items.length - 1].preview || '';
        }
  
        if (zuck.internalData.seenItems[storyId] === true) {
          data.seen = true;
        }
        data.currentPreview = preview;
  
        if (!storyEl) {
          const storyItem = document.createElement('div');
          storyItem.innerHTML = option('template', 'timelineItem')(data);
  
          story = storyItem.firstElementChild;
        } else {
          story = storyEl;
        }
        if (data.seen === false) {
          zuck.internalData.seenItems[storyId] = false;
          saveLocalData('seenItems', zuck.internalData.seenItems);
        }
  
        story.setAttribute('data-id', storyId);
        story.setAttribute('data-photo', get(data, 'photo'));
        story.setAttribute('data-last-updated', get(data, 'lastUpdated'));
        story.setAttribute('data-own-story', get(data, 'ownStory'));
  
        parseStory(story);
  
        if (!storyEl && !option('reactive')) {
          if (append) {
            timeline.appendChild(story);
          } else {
            prepend(timeline, story);
          }
        }
  
        each(items, (i, item) => {
          zuck.addItem(storyId, item, append);
        });
        if (!append) {
          updateStorySeenPosition();
        }
      }
    };

    zuck.next = () => {
      modal.next();
    };

    zuck.remove = (storyId) => {
      const story = query(`#${id} > [data-id="${storyId}"]`);

      story.parentNode.removeChild(story);
    };

    zuck.addItem = (storyId, data, append) => {
      const story = query(`#${id} > [data-id="${storyId}"]`);
      if (!option('reactive') && story) {
        const li = document.createElement('li');
        const el = story.querySelectorAll('.items')[0];
        li.className = get(data, 'seen') ? 'seen' : '';
        li.setAttribute('data-id', get(data, 'id'));

        // wow, too much jsx
        li.innerHTML = option('template', 'timelineStoryItem')(data);

        if (append) {
          el.appendChild(li);
        } else {
          prepend(el, li);
        }
      }
      if (story) {
        parseItems(story, true, data);
      }
    };

    zuck.removeItem = (storyId, itemId) => {
      const item = query(`#${id} > [data-id="${storyId}"] [data-id="${itemId}"]`);

      if (!option('reactive')) {
        timeline.parentNode.removeChild(item);
      }
    };

    zuck.navigateItem = zuck.nextItem = (direction, event) => {
        const currentStory = zuck.internalData.currentStory;
        const currentItem = zuck.data[currentStory].currentItem;
        const storyViewer = query(`#zuck-modal .story-viewer[data-story-id="${currentStory}"]`);
        const directionNumber = direction === 'previous' ? -1 : 1;

        if (!storyViewer || storyViewer.touchMove === 1) {
          return false;
        }
        const currentItemElements = storyViewer.querySelectorAll(`[data-index="${currentItem}"]`);
        const currentPointer = currentItemElements[0];
        const currentItemElement = currentItemElements[1];

        const navigateItem = currentItem + directionNumber;
        const nextItems = storyViewer.querySelectorAll(`[data-index="${navigateItem}"]`);
        const nextPointer = nextItems[0];
        const nextItem = nextItems[1];
        if (storyViewer && nextPointer && nextItem) {
          const navigateItemCallback = function () {
            if (direction === 'previous') {
              currentPointer.classList.remove('seen');
              currentItemElement.classList.remove('seen');
            } else {
              currentPointer.classList.add('seen');
              currentItemElement.classList.add('seen');
              zuck.data[currentStory].items[currentItem].isStorySeen = true;
            }

            currentPointer.classList.remove('active');
            currentItemElement.classList.remove('active');

            nextPointer.classList.remove('seen');
            nextPointer.classList.add('active');

            nextItem.classList.remove('seen');
            nextItem.classList.add('active');

            each(storyViewer.querySelectorAll('.time'), (i, el) => {
              el.innerText = timeAgo(nextItem.getAttribute('data-time'));
            });

            zuck.data[currentStory].currentItem = zuck.data[currentStory].currentItem + directionNumber;

            playVideoItem(storyViewer, nextItems, event);
            zuck.sendViewItemUpdate();
          };

          let callback = option('callbacks', 'onNavigateItem');
          callback = !callback ? option('callbacks', 'onNextItem') : option('callbacks', 'onNavigateItem');
          callback(currentStory, nextItem.getAttribute('data-story-id'), navigateItemCallback);
        } else if (storyViewer) {
          if (direction !== 'previous') {
            modal.next(event);
          }
        }
    };

    zuck.sendViewItemUpdate = function () {
      var storyViewer = query('#zuck-modal .viewing');
      var currentSlideIndex = storyViewer.querySelector('.item.active').getAttribute('data-index');
      const currentDataItem = zuck.data.filter(eachData => {
        return eachData.id == storyViewer.getAttribute('data-story-id');
      })[0];
      if (currentDataItem && currentSlideIndex >= 0) {
        option('callbacks', 'onUserViewComplete')(storyViewer.getAttribute('data-story-id'), currentDataItem.items[currentSlideIndex].id);
      }
    };

    const init = function () {
      if (timeline && timeline.querySelector('.story')) {
        each(timeline.querySelectorAll('.story'), (storyIndex, story) => {
          parseStory(story);
        });
      }

      if (option('backNative')) {
        window.addEventListener(
          'popstate',
          e => {
            if (window.location.hash === '') {
              window.location.hash = '';
              window.location.reload();
            }
          },
          false
        );
      }

      if (!option('reactive')) {
        const seenItems = getLocalData('seenItems');

        each(Object.keys(seenItems), (keyIndex, key) => {
          if (zuck.data[key]) {
            zuck.data[key].seen = seenItems[key];
          }
        });
      }

      each(option('stories'), (itemKey, item) => {
        zuck.add(item, true);
      });
      updateStorySeenPosition();

      const avatars = option('avatars') ? 'user-icon' : 'story-preview';
      const list = option('list') ? 'list' : 'carousel';
      const rtl = option('rtl') ? 'rtl' : '';

      timeline.className += ` stories ${avatars} ${list} ${(`${option('skin')}`).toLowerCase()} ${rtl}`;

      return zuck;
    };

    return init();
  };

  /* Helpers */
  ZuckJS.buildTimelineItem = (id, photo, name, link, ownStory, lastUpdated, items) => {
    const timelineItem = {
      id,
      photo,
      name,
      link,
      ownStory,
      lastUpdated,
      items: []
    };

    each(items, (itemIndex, itemArgs) => {
      timelineItem.items.push(ZuckJS.buildStoryItem.apply(ZuckJS, itemArgs));
    });

    return timelineItem;
  };

  ZuckJS.buildStoryItem = (id, type, length, src, preview, link, linkText, seen, time) => {
    return {
      id,
      type,
      length,
      src,
      preview,
      link,
      linkText,
      seen,
      time
    };
  };

  /* Legacy code */
  ZuckJS.buildItem = ZuckJS.buildStoryItem;

  // CommonJS and Node.js module support.
  if (typeof exports !== 'undefined') {
    // Support Node.js specific `module.exports` (which can be a function)
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = ZuckJS;
    }
    // But always support CommonJS module 1.1.1 spec (`exports` cannot be a function)
    exports.ZuckJS = ZuckJS;
  } else {
    /* Too much zuck zuck to maintain legacy */
    window.ZuckitaDaGalera = window.Zuck = ZuckJS;
  }

  return ZuckJS;
})(window || {});
