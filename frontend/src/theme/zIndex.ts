const zIndex = {
  background: -1,

  base: 0,
  content: 10,

  header: 100,
  sticky: 110,

  sidebar: 200,
  navigation: 210,

  dropdown: 10050,
  popover: 10051,
  tooltip: 10052,

  overlay: 400,
  modal: 410,
  drawer: 420,

  toast: 500,
  notification: 510,
} as const

export default zIndex