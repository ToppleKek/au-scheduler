import * as Constants from './constants';

// function get_cal_html(options) {
//     const params = (options?.term && options?.campus) ? `?term=${options.term}&campus=${options.campus}` : '';

//     return new Promise((resolve) => {
//         fetch(`${Constants.CORS_ANYWHERE_PROXY_URL}/${Constants.AU_COURSE_CALENDAR_URL}${params}`)
//             .then((response) => response.text())
//             .then((text) => resolve(text));
//     });
// }

// function parse_courses(class_list_element) {
//     const courses = [];

//     for (const e of class_list_element.children) {
//         const course_header = e.querySelector('.panel-title').innerText.split('-');
//         const course_code_full = course_header[0].trim();
//         const course_body = e.querySelector('.panel-body');
//         const course_time_location = course_body.querySelector('.pull-left').children[0].innerHTML.trim().split('<br>');
//         const registration_header = e.querySelector('.pull-right').innerText.trim();
//         const instructor_type_location = Array.from(course_body.querySelector('.pull-right').children).map((e) => e.innerText);

//         let runtime, day, time, location;

//         if (course_time_location.length !== 1)
//             course_time_location.pop(); // Remove empty element

//         // Note: DomParser for some reason does not parse <br> tags as newlines.
//         if (course_time_location.join('') !== 'Online') {
//             for (const l of course_time_location) {
//                 const line = l.trim();
//                 if (line.match(/MON|TUE|WED|THU|FRI/g))
//                     day = line;
//                 else if (!window.isNaN(line.charAt(0)))
//                     time = line;
//                 else if (line.startsWith('Location:'))
//                     location = line.slice(10);
//                 else
//                     runtime = line;
//             }
//         }

//         let coinstructor, course_type, delivery_method;

//         if (instructor_type_location.length === 3) {
//             coinstructor = instructor_type_location[1].slice(14);
//             course_type = instructor_type_location[2].split(',')[0];
//             delivery_method = instructor_type_location[2].split(',')[1].trim();
//         } else if (instructor_type_location.length === 2) {
//             coinstructor = null;
//             course_type = instructor_type_location[1].split(',')[0];
//             delivery_method = instructor_type_location[1].split(',')[1].trim();
//         }

//         const course = {
//             course_code_full,
//             course_code: course_code_full.slice(0, -2),
//             course_code_modifier: course_code_full.slice(course_code_full.length - 2),
//             course_name: course_header.slice(1).join('-').trim(),
//             registration_available: registration_header === 'REGISTRATION AVAILABLE',
//             limited_registration: registration_header === 'LIMITED REGISTRATION AVAILABLE',
//             cancelled: registration_header === 'CANCELLED',
//             registration_status: registration_header,
//             online: delivery_method === 'Online',
//             runtime,
//             day,
//             time,
//             location,
//             instructor: instructor_type_location[0].slice(12),
//             coinstructor,
//             course_type,
//             delivery_method,
//             description: course_body.children[course_body.children.length - 1].innerText,
//         };

//         courses.push(course);
//     }

//     return courses;
// }

// export async function get_initial_courses_and_terms() {
//     const dom_parser = new DOMParser();
//     const initial_cal_document = dom_parser.parseFromString(await get_cal_html(), 'text/html');
//     const term_selector_elements = Array.from(initial_cal_document.getElementsByName('term')[0].children);
//     const terms = term_selector_elements.map((e) => {return { code: e.value, name: e.innerText }});
//     const row_elements = initial_cal_document.getElementsByClassName('row');

//     return { terms, initial_courses: parse_courses(row_elements[3].children[0]) };
// }

// export async function get_courses(term, campus) {
//     const dom_parser = new DOMParser();
//     const cal_document = dom_parser.parseFromString(await get_cal_html({ term, campus }), 'text/html');
//     const row_elements = cal_document.getElementsByClassName('row');
//     return parse_courses(row_elements[3].children[0]);
// }

export function shallow_equality(obj1, obj2) {
    const obj1_keys = Object.keys(obj1);
    const obj2_keys = Object.keys(obj2);

    if (obj1_keys.length !== obj2_keys.length)
        return false;

    return obj1_keys.every((key) => obj1[key] === obj2[key]) &&
           obj2_keys.every((key) => obj2[key] === obj1[key]);
}

export function deep_clone(obj) {
    if (window.structuredClone)
        return window.structuredClone(obj);

    // Safari :D
    const ret = {};
    for (const key in obj) {
        if ((Array.isArray(obj[key])))
            ret[key] = [].concat(obj[key]);
        else if ((typeof obj[key]) === 'object')
            ret[key] = deep_clone(obj[key]);
        else
            ret[key] = obj[key];
    }

    return ret;
}

export function date_delta(from, to) {
    const delta = Math.floor((to - from) / 1000);

    if (delta < 60)
        return `${delta} second${delta === 1 ? '' : 's'} ago`;

    if ((delta / 60) < 60) {
        const d = Math.floor(delta / 60);
        return `${d} minute${d === 1 ? '' : 's'} ago`;
    }

    const d = Math.floor(delta / 60 / 60);
    return `${d} hour${d === 1 ? '' : 's'} ago`;
}

function relative_luminance(r, g, b) {
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function parse_colour(colour) {
    const n = Number.parseInt(colour.slice(1), 16);
    let r, g, b;
    if (colour.slice(1).length === 3) {
        r = (n & 0xf00) >>> 4;
        g = n & 0xf0;
        b = (n & 0xf) << 4;

        r |= r >>> 4;
        g |= g >>> 4;
        b |= b >>> 4;
    } else if (colour.slice(1).length === 6) {
        r = (n & 0xff0000) >>> 16;
        g = (n & 0xff00) >>> 8;
        b = n & 0xff;
    }

    return { r, g, b };
}

export function text_colour_from_bg(r, g, b) {
    return relative_luminance(r, g, b) < 128 ? 'light' : 'dark';
}

export function group_course(code) {
    const discipline = code.slice(0, 4);

    if (Constants.COURSES_GROUP_1.includes(discipline))
        return 'I';
    if (Constants.COURSES_GROUP_2.includes(discipline))
        return 'II';
    if (Constants.COURSES_GROUP_3.includes(discipline))
        return 'III';
    if (Constants.COURSES_GROUP_4.includes(discipline))
        return 'IV';

    return '?';
}

export function condense_courses(courses) {
    const course_map = new Map();

    for (const course of courses) {
        if (!course_map.has(course.course_code))
            course_map.set(course.course_code, [course]);
        else
            course_map.get(course.course_code).push(course);
    }

    return course_map;
}

export function timestr_to_ints(timestr) {
    const times = timestr.replaceAll(' ', '').split('-');

    for (let i = 0; i < times.length; ++i) {
        const tod = times[i].slice(times[i].length - 2);
        times[i] = Number.parseInt(times[i].slice(0, times[i].length - 2).replace(':', ''));

        if (times[i] !== 1200 && tod === 'PM')
            times[i] += 1200;
    }

    return { start: times[0], end: times[1] };
}

function daystr_to_days(daystr) {
    return daystr.replaceAll(' ', '').split('/');
}

function between(x, y, z) {
    return x > y && x < z;
}

function check_conflict(course1, course2) {
    if (course1.course_code_full === course2.course_code_full ||
        !course1.time || !course2.time || !course1.day || !course2.day)
        return false;

    const course2_days = daystr_to_days(course2.day);

    if (!daystr_to_days(course1.day).some((e) => course2_days.includes(e)))
        return false;

    const course1_times = timestr_to_ints(course1.time);
    const course2_times = timestr_to_ints(course2.time);

    return between(course1_times.start, course2_times.start, course2_times.end) ||
        between(course1_times.end, course2_times.start, course2_times.end) ||
        course1_times.start === course2_times.start;
}

function earliest_start(courses) {
    let min = { course_code: '', value: 2200 }; // Latest a course can go to

    for (const course of courses) {
        if (!course.time || course.online)
            continue;

        const start = timestr_to_ints(course.time).start;
        if (start < min.value)
            min = { course_code: course.course_code_full, value: start };
    }

    return min;
}

function latest_start(courses) {
    let max = { course_code: '', value: 0 };

    for (const course of courses) {
        if (!course.time || course.online)
            continue;

        const start = timestr_to_ints(course.time).start;
        if (max.value < start)
            max = { course_code: course.course_code_full, value: start };
    }

    return max;
}

function courses_by_day(courses) {
    const days = {
        mon: [],
        tue: [],
        wed: [],
        thu: [],
        fri: []
    };

    for (const course of courses) {
        if (!course.day || course.online)
            continue;

        const course_days = course.day.toLowerCase().split(' / ');
        for (const day in days) {
            if (course_days.includes(day))
                days[day].push(course);
        }
    }

    return days;
}

// Higher the score, the later the start time
function score_time(courses, empty_day_bonus) {
    const days = courses_by_day(courses);

    let score = 0;

    for (const day in days)
        score += days[day].length === 0 ? empty_day_bonus : latest_start(days[day]).value;

    return score;
}

// Higher the score, the less compact
function score_compact(courses) {
    const days = courses_by_day(courses);

    let score = 0;

    for (const day in days)
        score += latest_start(days[day]).value - earliest_start(days[day]).value;

    return score;
}

// Higher the score, the more async courses
function score_async(courses) {
    return courses.filter((course) => !!!course.time).length;
}

export function cartesian(courses) {
    if (courses.length === 1)
        return courses[0].map((course) => [course]);

    // stackoverflow.com/questions/12303989/cartesian-product-of-multiple-arrays-in-javascript/57597533#57597533
    return courses.reduce((acc, curr) => acc.flatMap(c => curr.map(n => [].concat(c, n))));
}

export function schedule(courses) {
    /*
        courses looks like:
        {
            'code':{
                colour: '#fff',
                children: [cosc1047ae, be, ...]
            }
        }
    */
    const children = [];

    for (const course in courses)
        children.push(courses[course].children);

    if (children.length === 0)
        return [];

    const only_lectures = children.map((child) => child.filter((course) => course.course_type === 'Lecture'));
    const only_labs = children.map((child) => child.filter((course) => course.course_type === 'Lab')).filter((child) => child.length !== 0);
    const lec_schedule = only_lectures.length !== 0 ? cartesian(only_lectures) : [];
    const lab_schedule = only_labs.length !== 0 ? cartesian(only_labs) : [];
    const full_schedule = [lec_schedule, lab_schedule].filter((schedule) => schedule.length !== 0);
    const schedules = full_schedule.length === 1 ? full_schedule[0] : cartesian(full_schedule);

    let filtered_schedules = schedules;

    filtered_schedules = filtered_schedules.filter((schedule) => {
        for (let i = 0; i < schedule.length; ++i) {
            for (let j = i; j < schedule.length; ++j) {
                if (check_conflict(schedule[i], schedule[j]))
                    return false;

                // Do not schedule accelerated labs with regular lectures and vice versa
                if (schedule[i].course_code === schedule[j].course_code && schedule[i].runtime !== schedule[j].runtime)
                    return false;
            }
        }

        return true;
    });

    return filtered_schedules.map((schedule) =>{
        schedule.forEach((course) => course.colour = courses[course.course_code].colour);
        return schedule;
    });
}

export function sort_schedules(method, schedules) {
    switch (method) {
        case 'latest':
            return schedules.sort((a, b) => score_time(b, 2200) - score_time(a, 2200));
        case 'earliest':
            return schedules.sort((a, b) => score_time(a, 0) - score_time(b, 0));
        case 'compact':
            return schedules.sort((a, b) => score_compact(a) - score_compact(a));
        case 'most_async':
            return schedules.sort((a, b) => score_async(b) - score_async(a));
        case 'least_async':
                return schedules.sort((a, b) => score_async(a) - score_async(b));
        default:
            return schedules;
    }
}
