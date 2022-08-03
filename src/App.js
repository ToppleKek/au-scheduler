import './App.css';
import * as Util from './util';
import * as Constants from './constants';
import * as Status from './status/status';
import * as RichPopup from './status/RichPopup';
import { Component, createRef } from 'react';
import html2canvas from 'html2canvas';
import * as StorageSchema from './storage_schema.json';
import Ajv from 'ajv';
import {
    Selector,
    CourseList,
    Scheduler,
    CalendarView,
    InlineButton,
    Button
} from './components';

const validate_storage = new Ajv().compile(StorageSchema);

class App extends Component {
    constructor(props) {
        super(props);

        this.theme = 'dark';
        this.calendar_view_ref = createRef();

        this._update_theme();
        Status.register_popup_callback(this.on_popup_request);
        Status.register_rich_popup_callback(this.on_rich_popup_request);

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
            scheduler_mode: Constants.SCHEDULER_DEFAULT_MODE,
            filter: { online: false },
            theme: 'dark',
            popup: {
                rich: false,
                rich_body: [],
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
    _init_local_storage(course_data) {
        const current_campus = Constants.AU_CAMPUS_LOCATIONS[0];
        localStorage.setItem('current_campus', current_campus);

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

    current_sd = (state) => {
        if (!state)
            state = this.state;

        return state.schedule_data[state.current_campus];
    }

    current_term_code = (state) => {
        const sd = this.current_sd(state);
        return sd.current_term.code;
    }

    current_term = (state) => {
        const sd = this.current_sd(state);
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
                if (!schedule_data || !validate_storage(schedule_data))
                    schedule_data = this._init_local_storage(json);

                // Remove terms that no longer exist
                for (const campus in schedule_data) {
                    for (const term in schedule_data[campus].terms) {
                        if (json.campuses[campus].terms.filter((t) => t.code === term).length === 0)
                            delete schedule_data[campus].terms[term];
                    }
                }

                // Add terms that are new
                for (const campus of Constants.AU_CAMPUS_LOCATIONS) {
                    for (const term of json.campuses[campus].terms) {
                        if (!schedule_data[campus].terms.hasOwnProperty(term.code)) {
                            schedule_data[campus].terms[term.code] = {
                                staged_courses: {},
                                current_schedule: []
                            };
                        }
                    }
                }

                loaded_term = json.campuses[current_campus_name].terms.find(
                    (term) => term.code === schedule_data[current_campus_name].current_term.code
                );

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
        return this.on_generic_popup_request(false, buttons, {header, message});
    }

    on_rich_popup_request = (buttons, header, body) => {
        return this.on_generic_popup_request(true, buttons, {header, body});
    }

    on_generic_popup_request = (rich, buttons, opts) => {
        const dialog_promise = new Promise((resolve) => {
            this.setState((state, props) => {
                if (state.popup.callback !== null)
                    resolve(null);

                return {
                    popup: {
                        rich,
                        rich_body: rich ? opts.body : [],
                        header: opts.header,
                        message: !rich ? opts.message : null,
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
                    rich: false,
                    rich_body: [],
                    header: null,
                    message: null,
                    buttons: [],
                    callback: null
                }
            });

            resolve(dialog_result);
        });
    }

    on_generate_image = () => {
        if (!this.calendar_view_ref.current)
            return;

        // Create a copy of the calendar view to 'screenshot'
        const copy = this.calendar_view_ref.current.cloneNode(true);

        // Move the copy of the calendar view off screen
        copy.style.position = 'relative';
        copy.style.left = 0;
        copy.style.bottom = `1400px`;
        copy.style.height = '1000px';
        copy.style.width = '1400px';

        document.body.appendChild(copy);
        html2canvas(copy).then((canvas) => {
            const current_term_code = this.current_term_code();
            const current_term_name = this.state.course_data.campuses[this.state.current_campus].terms.find(
                (term) => term.code === current_term_code
            ).name;
            const filename = `AU-Schedule ${this.state.current_campus} ${current_term_name}.png`;
            const a = document.createElement('a');

            a.href = canvas.toDataURL('image/png');
            a.download = filename;
            a.click();
            a.remove();
            canvas.remove();
            copy.remove();
        });
    }

    on_theme_toggle = () => {
        this.theme = this.theme === 'dark' ? 'light' : 'dark';
        this._update_theme();
    }

    on_campus_change = (new_campus) => {
        this.setState((state, props) => {
            // const new_term_code = state.schedule_data[new_campus].current_term.code;
            // cosnt courses = state.course_data.campuses[new_campus].terms.find(
            //     (term) => term.code === new_term_code
            // );
            return {
                current_campus: new_campus
            };
        }, () => {
            this.on_term_change(this.current_term_code());
        });
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

    test_rich = () => {
        const body = (
            <>
                <RichPopup.Checkbox key_name={'test'} name={'test'} label={'test checkbox'} value={true} />
            </>
        );
        Status.rich_popup(
            [Constants.POPUP_BUTTON_YES, Constants.POPUP_BUTTON_NO],
            'Test RichPopup dialog',
            body,
        ).then((result) => {
            console.log(result.button);
            console.dir(result.data);
        });
    }

    on_edit_schedule_filter = () => {
        const body = (
            <>
                <RichPopup.Header>Course Options</RichPopup.Header>
                <RichPopup.Checkbox key_name='online_filter' label='Exclude online courses' value={this.state.filter.online} />
            </>
        );

        Status.rich_popup(
            [Constants.POPUP_BUTTON_OK, Constants.POPUP_BUTTON_CANCEL],
            'Edit Schedule Filter',
            body
        ).then((result) => {
            if (result.button === Constants.POPUP_BUTTON_OK) {
                this.setState((state) => {
                    const copy = { ...state.filter };
                    copy.online = result.data.online_filter;

                    return {
                        filter: copy
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

        const term_options = this.state.course_data.campuses[this.state.current_campus].terms.map((term) => ({
            value: term.code,
            key: term.code,
            name: term.name
        }));

        const campus_options = Object.keys(this.state.course_data.campuses).map((campus) => ({
            value: campus,
            key: campus,
            name: campus
        }));

        let popup = null;

        if (this.state.popup.callback !== null && this.state.popup.rich) {
            popup = (
                <RichPopup.Popup
                    header={this.state.popup.header}
                    buttons={this.state.popup.buttons}
                    onInteract={this.state.popup.callback}
                >
                    {this.state.popup.rich_body}
                </RichPopup.Popup>
            );
        } else if (this.state.popup.callback !== null) {
            popup = (
                <Status.Popup
                    header={this.state.popup.header}
                    message={this.state.popup.message}
                    buttons={this.state.popup.buttons}
                    onInteract={this.state.popup.callback}
                />
            )
        }

        return (
            <div className="App">
                {popup}

                <div className='banner header'>
                    <div className='banner-left'>
                        <div className='banner-text title-text'>au-scheduler</div>
                        <div>
                            <Selector
                                options={campus_options}
                                value={this.state.current_campus}
                                onChange={this.on_campus_change}
                            />
                        </div>
                    </div>
                    <div className='banner-right'>
                        <InlineButton value='Rich Popup' onClick={this.test_rich} />
                        <InlineButton value='Generate image' onClick={this.on_generate_image} />
                        <InlineButton value='Change theme' onClick={this.on_theme_toggle} />
                    </div>
                </div>
                <div className='main-content'>
                    <div className='sidebar app-component'>
                        <Selector options={term_options} value={this.state.schedule_data[this.state.current_campus].current_term.code} onChange={this.on_term_change} />
                        <Button
                            role={'normal'}
                            value={'Reset Selections'}
                            onClick={this.stage_reset}
                        />
                        <CourseList
                            courses={this.state.courses}
                            staged_courses={this.current_term().staged_courses}
                            onStage={this.on_stage}
                            onUnstage={this.on_unstage}
                        />
                    </div>
                    <div className='scheduler-wrapper app-component'>
                        <Selector options={Constants.SCHEDULER_MODE_OPTIONS} value={this.state.scheduler_mode} onChange={this.on_scheduler_mode_change} />
                        <Button role='normal' value='Filter...' onClick={this.on_edit_schedule_filter} />
                        <Scheduler
                            courses={this.current_term().staged_courses}
                            mode={this.state.scheduler_mode}
                            filter={this.state.filter}
                            onSchedule={this.on_current_schedule_change}
                        />
                    </div>
                    <div className='calendar-wrapper app-component' ref={this.calendar_view_ref}>
                        <CalendarView schedule={this.current_term().current_schedule} />
                    </div>
                </div>
                <div className='banner'>
                    <div className='banner-left'>
                        <div className='banner-text'>
                            {`Course information scraped ${Util.date_delta(this.state.course_data.scrape_date, Date.now())}`}
                        </div>
                    </div>
                    <div className='banner-center'>
                        <div className='banner-text'></div>
                    </div>
                    <div className='banner-right'>
                        <div className='banner-text'>(c) 2022 Braeden Hong</div>
                    </div>
                </div>
            </div>
        );
    }
}

export default App;
