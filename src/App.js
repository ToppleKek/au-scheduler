import './App.css';
import * as Util from './util';
import Selector from './components/Selector';
import CourseList from './components/CourseList';
import CourseSearch from './components/CourseSearch';
import Scheduler from './components/Scheduler';
import CalendarView from './components/CalendarView';
import Checkbox from './components/Checkbox';
import * as Constants from './constants';
import * as Status from './status/status';
import { Component } from 'react';
import InlineButton from './components/InlineButton';
import Button from './components/Button';

class App extends Component {
    constructor(props) {
        super(props);

        this.theme = 'dark';
        this._update_theme();

        Status.register_popup_callback(this.on_popup_request);

        let schedule_data = localStorage.getItem('schedule_data');
        if (schedule_data)
            schedule_data = JSON.parse(schedule_data);
        else
            schedule_data = null;

        this.state = {
            local_storage_initialized: true,
            course_data: null,
            schedule_data,
            terms: [],
            courses: [],
            current_campus: localStorage.getItem('current_campus') || Constants.AU_CAMPUS_LOCATIONS[0],
            search_term: '',
            scheduler_mode: Constants.SCHEDULER_DEFAULT_MODE,
            filter: { online: false },
            theme: 'dark',
            popup: {
                header: null,
                message: null,
                buttons: [],
                callback: null
            }
        };
    }

    _update_theme() {
        for (const prop in Constants.THEMES[this.theme])
            document.documentElement.style.setProperty(`--colour-${prop}`, Constants.THEMES[this.theme][prop]);
    }

    _save_state() {
        if (!this.state.local_storage_initialized) {
            console.log('localStorage was not initialized yet. aborting save.');
            return;
        }

        localStorage.setItem('current_campus', this.state.current_campus);
        localStorage.setItem('schedule_data', JSON.stringify(this.state.schedule_data));
    }

    /**
     * Initialize defaults in localStorage.
     */
    _init_local_storage(course_data, current_campus) {
        localStorage.setItem('current_campus', Constants.AU_CAMPUS_LOCATIONS[0]);

        const schedule_data = {};
        for (const campus of Constants.AU_CAMPUS_LOCATIONS) {
            const campus_data = {
                current_term: {
                    code: course_data.campuses[current_campus].terms[0].code,
                    name: course_data.campuses[current_campus].terms[0].name
                },
                terms: {}
            };

            for (const term of course_data.campuses[current_campus].terms) {
                campus_data.terms[term.code] = {
                    staged_courses: {},
                    current_schedule: []
                };
            }

            schedule_data[campus] = campus_data;
        }

        localStorage.setItem('schedule_data', JSON.stringify(schedule_data));
        return schedule_data;
    }

    current_term(state) {
        if (!state)
            state = this.state;

        const sd = state.schedule_data[state.current_campus];
        return sd.terms[sd.current_term.code];
    }

    componentDidMount() {
        console.log('App did mount!');
        fetch('/course_data.json')
            .then((response) => response.json())
            .then((json) => {
                console.log('App did fetch course_data');
                const current_campus_name = this.state.current_campus || Constants.AU_CAMPUS_LOCATIONS[0];

                let loaded_term;
                let schedule_data = this.state.schedule_data;
                if (!schedule_data)
                    schedule_data = this._init_local_storage(json, current_campus_name);

                loaded_term = json.campuses[current_campus_name].terms.find(
                    (term) => term.code === schedule_data[current_campus_name].current_term.code
                )

                this.setState({
                    course_data: json,
                    schedule_data,
                    courses: loaded_term ? loaded_term.courses : json.campuses[current_campus_name].terms[0].courses
                });
        });
    }

    componentDidUpdate(previous_props) {
        console.log('App did update!');
        this._save_state();
    }

    on_popup_request = (buttons, header, message) => {
        const dialog_promise = new Promise((resolve) => {
            this.setState((state, props) => {
                if (state.popup.callback !== null)
                    resolve(null);

                return {
                    popup: {
                        header,
                        message,
                        buttons,
                        callback: resolve
                    }
                };
            });
        });

        return new Promise(async (resolve) => {
            const dialog_result = await dialog_promise;

            this.setState({
                popup: {
                    header: null,
                    message: null,
                    buttons: [],
                    callback: null
                }
            });

            resolve(dialog_result);
        });
    }

    on_theme_toggle = () => {
        this.theme = this.theme === 'dark' ? 'light' : 'dark';
        this._update_theme();
    }

    on_term_change = (new_term_code) => {
        console.log(`Term changed to ${new_term_code}`);

        this.setState((state, props) => {
            const new_term = state.course_data.campuses[state.current_campus].terms.find(
                (term) => term.code === new_term_code
            );

            const schedule_data = { ...state.schedule_data };

            schedule_data[state.current_campus].current_term = {
                code: new_term.code,
                name: new_term.name
            };

            return {
                courses: new_term.courses,
                schedule_data
            };
        });
    }

    on_search = (text) => {
        this.setState({
            search_term: text
        });
    }

    on_stage = (course_code, children) => {
        this.setState((state, props) => {

            // We do not need the description here and it takes up a huge chunk
            // of space when we save our state to localStorage. We really don't
            // actually need to save all the course data to localStorage, but it's
            // a quick and dirty way to save our state.
            for (const course of children)
                delete course.description;

            const current_term_copy = { ...this.current_term(state) };
            const schedule_data = { ...state.schedule_data };
            const current_term_code = schedule_data[state.current_campus].current_term.code;

            current_term_copy.staged_courses[course_code] = {
                colour: `#${Math.floor(Math.random() * 4096).toString(16).padStart(3, '0')}`,
                children
            };

            schedule_data[state.current_campus].terms[current_term_code] = current_term_copy;

            return {
                schedule_data
            };
        });
    }

    on_unstage = (course_code) => {
        this.setState((state, props) => {
            const current_term_copy = { ...this.current_term(state) };
            const schedule_data = { ...state.schedule_data };
            const current_term_code = schedule_data[state.current_campus].current_term.code;

            delete current_term_copy.staged_courses[course_code];
            schedule_data[state.current_campus].terms[current_term_code] = current_term_copy;

            return {
                schedule_data
            };
        });
    }

    on_scheduler_mode_change = (new_mode) => {
        this.setState({
            scheduler_mode: new_mode
        });
    }

    on_current_schedule_change = (new_schedule) => {
        this.setState((state, props) => {
            const schedule_data = { ...state.schedule_data };
            const current_term_copy = { ...this.current_term(state) };
            const current_term_code = schedule_data[state.current_campus].current_term.code;


            current_term_copy.current_schedule = new_schedule;
            schedule_data[state.current_campus].terms[current_term_code] = current_term_copy;

            return {
                schedule_data
            };
        });
    }

    on_online_course_filter_change = (checked) => {
        this.setState((state, props) => {
            const copy = { ...state.filter };
            copy.online = checked;
            return {
                filter: copy
            };
        });
    }

    stage_reset = () => {
        Status.popup(
            [Constants.POPUP_BUTTON_YES, Constants.POPUP_BUTTON_NO],
            'Course Stage Reset',
            'Are you sure you want to remove all courses from the stage?'
        ).then((button) => {
            if (button === Constants.POPUP_BUTTON_YES) {
                this.setState((state, props) => {
                    const schedule_data = { ...state.schedule_data };
                    this.current_term().staged_courses = {};

                    return {
                        schedule_data
                    };
                });
            }
        });
    }

    render() {
        if (!this.state.course_data) {
            console.log('Course data is still null');
            return (
                <div className='App'>
                    Loading course data.
                </div>
            );
        }

        const term_options = this.state.course_data.campuses[this.state.current_campus].terms.map((term) => {
            return {
                value: term.code,
                key: term.code,
                name: term.name
            };
        });

        return (
            <div className="App">
                {this.state.popup.callback !== null ?
                    <Status.Popup
                        header={this.state.popup.header}
                        message={this.state.popup.message}
                        buttons={this.state.popup.buttons}
                        onInteract={this.state.popup.callback}
                    />
                : null}

                <div className='header'>
                    <span className='header-text'>au-scheduler</span>
                    <InlineButton value={'Change theme'} onClick={this.on_theme_toggle} />
                </div>
                <div className='main-content'>
                    <div className='sidebar app-component'>
                        <Selector options={term_options} value={this.state.schedule_data[this.state.current_campus].current_term.code} onChange={this.on_term_change} />
                        <CourseSearch onChange={this.on_search} />
                        <Button
                            role={'normal'}
                            value={'Reset Selections'}
                            onClick={this.stage_reset}
                        />
                        <CourseList
                            courses={this.state.courses}
                            staged_courses={this.current_term().staged_courses}
                            search_term={this.state.search_term}
                            onStage={this.on_stage}
                            onUnstage={this.on_unstage}
                        />
                    </div>
                    <div className='scheduler-wrapper app-component'>
                        <Selector options={Constants.SCHEDULER_MODE_OPTIONS} value={this.state.scheduler_mode} onChange={this.on_scheduler_mode_change} />
                        <Checkbox name='online-filter' label='Exclude online courses' onChange={this.on_online_course_filter_change} />
                        <Scheduler
                            courses={this.current_term().staged_courses}
                            mode={this.state.scheduler_mode}
                            filter={this.state.filter}
                            onSchedule={this.on_current_schedule_change}
                        />
                    </div>
                    <div className='calendar-wrapper app-component'>
                        <CalendarView schedule={this.current_term().current_schedule} />
                    </div>
                </div>
                <div className='footer'>
                    <div className='footer-item'>
                        <div className='fetch-date-text'>
                            {`Course information scraped ${Util.date_delta(this.state.course_data.scrape_date, Date.now())}`}
                        </div>
                    </div>
                    <div className='footer-item'>
                        <div className='footer-text'>2022 Braeden Hong</div>
                    </div>
                    <div className='footer-item'>
                    </div>
                </div>
            </div>
        );
    }
}

export default App;
