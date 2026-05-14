const zIndex = {
  background: -1,

  base: 0,
  content: 10,

  header: 100,
  sticky: 110,

  sidebar: 200,
  navigation: 210,

  dropdown: 300,
  popover: 310,
  tooltip: 320,

  overlay: 400,
  modal: 410,
  drawer: 420,

  toast: 500,
  notification: 510,
} as const

export default zIndex