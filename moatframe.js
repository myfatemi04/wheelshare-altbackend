/* Copyright (c) 2011, 2019, Oracle and/or its affiliates. All rights reserved. */
(function () {
  try {
    const canAccessDomain = function (window) {
      try {
        window.domain;
      } catch (e) {
        return false;
      }
      return true;
    };
    const encodeForURL = function (s) {
      return s.replace(/:/g, "%3A").replace(/=/g, "%3D").replace(/,/g, "%2C");
    };
    const onMessage = function (message) {
      try {
        const data = message.data;
        if ("string" === typeof data) {
          const match = data.match(
            new RegExp(
              `([a-z]+)${separator}([a-z0-9.-]+)${separator}([0-9]+)${separator}([a-z]+)${separator}([0-9]+)${separator}(.+)`,
              "i"
            )
          );
          if (!match) {
            return;
          }
          const [
            _whole,
            matchedAPI,
            matchedVersion,
            matchedFirstRandomNumber,
            matchedLabel,
            matchedSecondRandomNumber,
            matchedEventName,
          ] = match;
          if (
            matchedAPI === api &&
            matchedVersion === version &&
            matchedEventName.includes("check")
          ) {
            const httpUrlRegex = /^(?:https?:\/\/)?[^.:\/]+(?:\.[^.:\/]+)/;
            const topWindowLocation =
              window.top && window.top.location && window.top.location.href;
            const fullUrl =
              topWindowLocation &&
              ("string" !== typeof topWindowLocation
                ? 0
                : httpUrlRegex.test(topWindowLocation))
                ? topWindowLocation
                : false;
            if (fullUrl) {
              const cleanUrl =
                window.top.location.hostname.replace("www.", "") +
                window.top.location.pathname;
              if (
                "string" === typeof cleanUrl &&
                "/" === cleanUrl.charAt(cleanUrl.length - 1)
              ) {
                cleanUrl = cleanUrl.substr(0, cleanUrl.length - 1);
              }
              if (cleanUrl) {
                let g = JSON.stringify({
                    available: false,
                    fullUrl: encodeForURL(fullUrl),
                    cleanUrl: encodeForURL(cleanUrl),
                    urlSrc: 5,
                  }),
                  g = g.replace(/"(\w+)"\s*:/g, "$1:"),
                  l = message.data.split(separator),
                  q = [
                    api,
                    version,
                    randomNumber,
                    matchedEventName,
                    l[4] || randomNumber + 1,
                    g,
                  ].join(separator);
                message.source.postMessage(q, "*");
              }
            }
          }
        }
      } catch (v) {}
    };
    const getFrames = function (window, depth) {
      function consolidateFrames(window, depth = 0) {
        var frames = [];
        if (window) {
          frames.push(window);
        }
        if (depth > 10 || !window || !window.frames) {
          return frames;
        }
        let frameCount;
        try {
          frameCount = isNaN(window.frames.length) ? 100 : window.frames.length;
        } catch (e) {
          frameCount = 100;
        }
        for (let i = 0; i < frameCount; i++)
          try {
            try {
              if (window.frames[i] == undefined) {
                break;
              }
            } catch (e) {
              break;
            }
            frames = frames.concat(
              consolidateFrames(window.frames[i], depth + 1)
            );
          } catch (e) {
            break;
          }
        return frames;
      }
      return consolidateFrames(window, depth);
    };
    const firePing = function () {
      const event = [
        api,
        version,
        randomNumber,
        label,
        randomNumber + 1,
        "ping",
      ].join(separator);
      const frames = getFrames(window.top);
      for (let i = 0; i < frames.length; i++) {
        if (frames[i] !== window.top) {
          frames[i].postMessage(event, "*");
        }
      }
    };

    const separator = "#";
    const api = "MSFAPI";
    const version = "1.2";
    const label = "addThis";
    const randomNumber = Math.floor(Math.random() * Math.pow(10, 12));
    if (
      window &&
      window.top &&
      canAccessDomain(window.top) &&
      true !== window.top["__@@##MUH"]
    ) {
      window.top.addEventListener("message", onMessage);
      window.top["__@@##MUH"] = true;
      firePing();
    }
  } catch (e) {}
})();
