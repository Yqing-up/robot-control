import axios from 'axios'

const BASE_URL = '/robot-head'

export const moveHeadUp = () => axios.post(`${BASE_URL}/robot/head/move_up`)
export const moveHeadDown = () => axios.post(`${BASE_URL}/robot/head/move_down`)
export const moveHeadLeft = () => axios.post(`${BASE_URL}/robot/head/move_left`)
export const moveHeadRight = () => axios.post(`${BASE_URL}/robot/head/move_right`)
export const resetHead = () => axios.post(`${BASE_URL}/robot/head/reset`)
export const stopHead = () => axios.post(`${BASE_URL}/robot/head/stop`)
export const getHeadStatus = () => axios.get(`${BASE_URL}/robot/head/status`)