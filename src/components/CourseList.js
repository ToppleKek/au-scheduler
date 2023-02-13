import { Component } from 'react';
import {
    Button,
    InlineButton,
    LineEdit
} from '.';
import * as Util from '../util';
import * as Status from '../status/status';
import * as RichPopup from '../status/RichPopup';
import * as Constants from '../constants';
import './style/CourseList.css';

const fuzzysort = require('fuzzysort');

class ListChildHeader extends Component {
    clicked = () => {
        this.props.onClick(this.props.course_code);
    }

    course_staged = () => {
        console.log('staged ' + this.props.course_code);
        this.props.onStage(this.props.course_code, this.props.children);
    }

    course_unstaged = () => {
        this.props.onUnstage(this.props.course_code);
    }

    render() {
        const colour_style = {
            backgroundColor: this.props.colour ? this.props.colour : 'var(--colour-primary)'
        };

        const no_colour_style = {
            paddingLeft: '11px',
            borderTopLeftRadius: '5px',
            borderBottomLeftRadius: '5px'
        };

        const text_class = `course-header-text ${this.props.expanded ? 'course-header-text-expanded' : ''}`;

        return (
            <div className='course-header'>
                {this.props.colour ? <div className='course-header-colour' style={colour_style} /> : null}
                <div
                    className={text_class}
                    onClick={this.clicked}
                    style={this.props.colour ? null : no_colour_style}
                >
                    <div className='course-header-action-bar'>
                        <span className='action-bar-text'>{this.props.course_code} ({Util.group_course(this.props.course_code)})</span>
                        <InlineButton
                            className='action-bar-button'
                            value={this.props.staged ? 'Remove' : 'Add'}
                            onClick={this.props.staged ? this.course_unstaged : this.course_staged}
                        />
                    </div>
                    {this.props.course_name}
                </div>
            </div>
        );
    }
}

export default class CourseList extends Component {
    constructor(props) {
        super(props);
        this.state = { expanded_courses: [], stage_expanded: true, search_term: '', search_options: {day: 'any', time: 'any'} };
    }

    _any_registration_available(courses) {
        for (const course of courses) {
            if (course.registration_available || course.limited_registration)
                return true;
        }

        return false;
    }

    _generate_course_element(course_code, child_courses) {
            let lecture_child_elements = [];
            let lab_child_elements = [];
            let other_child_elements = [];

            if (this.state.expanded_courses.includes(course_code)) {
                lecture_child_elements.push(<div key={`lec-header-${course_code}`} className='child-course-header-item'>LECTURES</div>);
                lab_child_elements.push(<div key={`lab-header-${course_code}`} className='child-course-header-item'>LABS</div>);
                other_child_elements.push(<div key={`other-header-${course_code}`} className='child-course-header-item'>OTHER</div>);

                const na = <span className="text-muted">N/A</span>;

                for (const course of child_courses) {
                    const elem = (
                        <div key={course.course_code_full + course.course_type} className='child-course-item'>
                            <b>{course.course_code_full}</b> ({course.instructor})<br />
                            {course.registration_status}<br />
                            <span className='course-item-block'>
                                <b>Runtime:</b> {course.runtime || na}<br />
                                <b>Days:</b> {course.day || na}<br />
                                <b>Time:</b> {course.time || na}<br />
                                <b>Delivery Method:</b> {course.delivery_method || na}<br />
                                <b>Location:</b> {course.location || na}<br />
                            </span>
                        </div>
                    );

                    if (course.course_type === 'Lecture')
                        lecture_child_elements.push(elem);
                    else if (course.course_type === 'Lab')
                        lab_child_elements.push(elem);
                    else
                        other_child_elements.push(elem);
                }
            }

            const colour = this.props.staged_courses[course_code]?.colour || '';

            return (
                <div key={course_code} className='course-item'>
                    {/* <div className={`course-header ${this._any_registration_available(child_courses) ? '' : 'course-header-unavailable'}`}>
                    </div> */}
                    <ListChildHeader
                        colour={colour}
                        course_code={course_code}
                        course_name={child_courses[0].course_name}
                        children={child_courses}
                        staged={this.props.staged_courses.hasOwnProperty(course_code)}
                        expanded={this.state.expanded_courses.includes(course_code)}
                        onClick={this.course_expanded}
                        onStage={this.props.onStage}
                        onUnstage={this.props.onUnstage}
                    />
                    {lecture_child_elements.length === 1 ? null : lecture_child_elements}
                    {lab_child_elements.length === 1 ? null : lab_child_elements}
                    {other_child_elements.length === 1 ? null : other_child_elements}
                </div>
            );
    }

    course_stage_expanded = () => {
        this.setState((state, props) => {
            return {
                stage_expanded: !state.stage_expanded
            };
        });
    }

    course_expanded = (course_code) => {
        this.setState((state, props) => {
            if (state.expanded_courses.includes(course_code)) {
                return {
                    expanded_courses: state.expanded_courses.filter((e) => e !== course_code)
                };
            }

            const new_courses = state.expanded_courses;
            new_courses.push(course_code);

            return {
                expanded_courses: new_courses
            };
        });
    }

    term_searched = (term) => {
        this.setState({
            search_term: term
        });
    }

    on_edit_search_options = () => {
        const day_options = [{
            value: 'any',
            key: 'any',
            name: 'Any'
        }, {
            value: 'MON',
            key: 'monday',
            name: 'Monday'
        }, {
            value: 'TUE',
            key: 'tuesday',
            name: 'Tuesday'
        }, {
            value: 'WED',
            key: 'wednesday',
            name: 'Wednesday'
        }, {
            value: 'THU',
            key: 'thursday',
            name: 'Thursday'
        }, {
            value: 'FRI',
            key: 'friday',
            name: 'Friday'
        }];

        const time_options = [{
            value: 'any',
            key: 'any',
            name: 'Any'
        }];

        for (let time = 800, b = true; time <= 2200; time += b ? 30 : 70, b = !b) {
            const timestr = time.toString();
            time_options.push({
                value: `${timestr}`,
                key: `${timestr}`,
                name: `${timestr.slice(0, timestr.length - 2)}:${timestr.slice(timestr.length - 2)}`
            });
        }

        const body = (
            <>
                <RichPopup.Header>Class Day</RichPopup.Header>
                <RichPopup.Selector key_name='day_filter' value={this.state.search_options.day} options={day_options} />
                <RichPopup.Header>Class Start Time</RichPopup.Header>
                <RichPopup.Selector key_name='time_filter' value={this.state.search_options.time} options={time_options} />
            </>
        );

        Status.rich_popup(
            [Constants.POPUP_BUTTON_OK, Constants.POPUP_BUTTON_CANCEL],
            'Edit Search Options',
            body
        ).then((result) => {
            if (result.button === Constants.POPUP_BUTTON_OK) {
                this.setState((state) => {
                    const copy = { ...state.search_options };
                    copy.day = result.data.day_filter ?? copy.day;
                    copy.time = result.data.time_filter ?? copy.time;

                    return {
                        search_options: copy
                    };
                });
            }
        });
    }

    render() {
        let filtered_courses = this.props.courses;

        if (this.state.search_term?.length > 0) {
            const options = {
                keys: ['course_code_full', 'course_name'],
                threshold: -10000
            };

            filtered_courses = fuzzysort.go(this.state.search_term, filtered_courses, options).map((e) => e.obj);
        }

        if (this.state.search_options.day !== 'any') {
            filtered_courses = filtered_courses.filter((course) => {
                if (!course.day)
                    return false;

                return course.day.includes(this.state.search_options.day);
            });
        }

        if (this.state.search_options.time !== 'any') {
            filtered_courses = filtered_courses.filter((course) => {
                if (!course.time)
                    return false;

                let start_time = course.time.split(' - ')[0];
                const pm = start_time.substr(-2, 2) === 'PM';

                start_time = Number.parseInt(start_time.replaceAll(/:|PM|AM/g, ''));

                if (pm)
                    start_time += 1200;

                return start_time.toString() === this.state.search_options.time;
            });
        }

        const course_stage = this.props.courses.filter((course) =>
            this.props.staged_courses.hasOwnProperty(course.course_code)
        );

        const course_map = Util.condense_courses(filtered_courses);
        const course_stage_map = Util.condense_courses(course_stage);
        const courses = [];
        const staged_courses = [];

        for (const [course_code, child_courses] of course_map.entries()) {
            if (!this.props.staged_courses.hasOwnProperty(course_code))
                courses.push(this._generate_course_element(course_code, child_courses));
        }

        for (const [course_code, child_courses] of course_stage_map.entries())
            staged_courses.push(this._generate_course_element(course_code, child_courses));

        return (
            <div className='course-list'>
                <LineEdit onChange={this.term_searched} placeholder='Search courses...' />
                <Button role='normal' value='Search Options...' onClick={this.on_edit_search_options} />
                <div className='course-list-body'>
                    <div className='course-list-header-item' onClick={this.course_stage_expanded}>Staged Courses</div>
                    <div className='course-list-stage'>
                        {this.state.stage_expanded ? staged_courses : null}
                    </div>
                    <div className='course-list-header-item'>All Courses</div>
                    {courses.length === 0 ? 'No results' : courses}
                </div>
            </div>

        );
    }
}
