/*
 * 모집 사이트 설정 — 이 파일만 고치면 됩니다.
 * 고친 뒤 깃허브에 올리면 바로 반영돼요.
 */
window.RECRUIT = {
  siteName: "씨네픽",
  round: "1기",

  // 마감일은 정하지 않았습니다. 심사와 결과 안내에 시간이 걸릴 수 있습니다.
  announce: "결과 안내까지 시간이 꽤 걸릴 수 있습니다. 모든 심사가 끝나는 대로 개별 연락드립니다.",

  // 문의 주소 (화면에 보여요)
  contactEmail: "jun752883@gmail.com",

  /*
   * 지원서 접수 주소 — 구글 Apps Script 웹 앱 주소를 넣으세요.
   * 지원서는 이 주소를 거쳐 jun752883@gmail.com 메일함으로 오고, 첨부 영상은 구글 드라이브에 저장됩니다.
   * 만드는 방법: apps-script/설치 방법.md
   *   예) "https://script.google.com/macros/s/AKfycb.../exec"
   */
  submitEndpoint: "https://script.google.com/macros/s/AKfycbzCtCYHEoyZBBnVYZlTh1AV7YkdBZNgTfxuuLBMK9Dp6a5Du2-ioVN1Ylnvg2htNrt8sw/exec",

  // 첨부 파일 크기 한도 (MB). 구글 Apps Script가 한 번에 받을 수 있는 양 때문에 30MB를 넘기지 마세요.
  maxVideoMB: 30,
  maxDocMB: 10,

  // 예고편 최대 길이 (초)
  maxTrailerSec: 60,

  // 글자 수 기준 [최소, 최대]
  limits: {
    intro: [200, 1500],
    long: [100, 1500],
    review: [300, 2500],
    oneLine: [0, 60],
  },
};
