export const CORS_ANYWHERE_PROXY_URL = 'http://localhost:8080';
export const AU_COURSE_CALENDAR_URL = 'https://students.algomau.ca/academic/calendarView2';
export const AU_CAMPUS_LOCATIONS = ['SSM', 'BRA', 'TIM', 'ONL'];
export const AU_COURSE_DATA_PLACEHOLDER = {
    scrape_date: 0,
    campuses: {
        SSM: {
            terms: []
        },
    }
};

// Unknown codes:
// STAT (social science? but its like math?),
// COOP (co-op, doesn't really matter),
// PMGT (project management?),
// AUAP (??)

export const COURSES_GROUP_1 = [
    'ANII', 'ENGL', 'FILM', 'FREN', 'HIST', 'MUSC', 'OJIB', 'PHIL', 'VISA',
];
export const COURSES_GROUP_2 = [
    'CESD', 'ECON', 'GEOG', 'ITEC', 'JURI', 'POLI', 'PSYC', 'SOCI',
];
export const COURSES_GROUP_3 = [
    'BIOL', 'CHMI', 'COSC', 'ENVS', 'GEOL', 'MATH', 'PHYS',
];
export const COURSES_GROUP_4 = [
    'ADMN', 'SWRK'
];

export const SCHEDULER_MODE_OPTIONS = [{
        value: 'latest',
        key: 'latest',
        name: 'latest'
    }, {
        value: 'earliest',
        key: 'earliest',
        name: 'earliest'
    }, {
        value: 'compact',
        key: 'compact',
        name: 'compact'
    }, {
        value: 'most_async',
        key: 'most_async',
        name: 'most async'
    }, {
        value: 'least_async',
        key: 'least_async',
        name: 'least async'
    }
];

export const SCHEDULER_DEFAULT_MODE = 'latest';
export const DAY_COLUMN_LABELS = ['mon', 'tue', 'wed', 'thu', 'fri'];

// export const POPUP_BUTTON_OK = 1 << 1;
// export const POPUP_BUTTON_YES = 1 << 2;
// export const POPUP_BUTTON_NO = 1 << 3;
// export const POPUP_BUTTON_CANCEL = 1 << 4;

export const POPUP_BUTTON_OK = 'OK';
export const POPUP_BUTTON_YES = 'Yes';
export const POPUP_BUTTON_NO = 'No';
export const POPUP_BUTTON_CANCEL = 'Cancel';

export const POPUP_BUTTONS_POSITIVE = [POPUP_BUTTON_OK, POPUP_BUTTON_YES];
export const POPUP_BUTTONS_NEGATIVE = [POPUP_BUTTON_NO, POPUP_BUTTON_CANCEL];

export const THEMES = {
    dark: {
        background: '#252525',
        text: 'white',
        primary: '#454545',
        highlight: '#eee',
        grid_border: '#151515',
        interactable: '#353535',
        positive_button: '#09ba38',
        positive_button_hover: '#057a24',
        negative_button: '#e63737',
        negative_button_hover: '#b61616',
        normal_button: '#505050',
        normal_button_hover: '#404040',
    },
    light: {
        background: '#eee',
        text: 'black',
        primary: '#ccc',
        highlight: '#555',
        grid_border: '#aeaeae',
        interactable: '#bbb',
        positive_button_hover: '#0fba38',
        negative_button: '#e63737',
        negative_button_hover: '#ee3737',
        normal_button: '#aaa',
        normal_button_hover: '#caa',
    }
};
