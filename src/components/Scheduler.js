import { Component } from 'react';
import * as Util from '../util';
import './style/Scheduler.css';

class CalendarPreview extends Component {
    on_schedule = (event) => {
        this.props.onSchedule(this.props.schedule);
    }

    render() {
        const num_async = this.props.schedule.filter((course) => !!!course.time).length;

        return (
            <div key={`preview-${this.props.id}`} className='calendar-preview' onClick={this.on_schedule}>
                <div className='calendar-preview-slots'>
                    {this.props.schedule.filter((course) => !!course.time).map((course) => {
                        const times = Util.timestr_to_ints(course.time);
                        return <PreviewTimeSlot
                            key={course.course_code_full + course.day}
                            id={course.course_code_full + this.props.id}
                            start_time={times.start}
                            end_time={times.end}
                            days={course.day}
                            colour={course.colour}
                        />;
                    })}
                </div>
                <div className='calendar-preview-footer'>
                    {num_async === 0 ? 'All classes in person' : `Including ${num_async} asynchronous classes`}
                </div>
            </div>
        );
    }
}

class PreviewTimeSlot extends Component {
    render() {
        const start = this.props.start_time.toString().padStart(4, '0');
        const end = this.props.end_time.toString().padStart(4, '0');
        const days = this.props.days.toLowerCase().split(' / ');
        const time_slots = [];

        let i = 0;
        for (const day of days) {
            const style = {
                gridRow: `time-${start} / time-${end}`,
                gridColumn: day,
                backgroundColor: this.props.colour
            };

            time_slots.push(
                <div
                    key={`ts-${++i}-${this.props.id}`}
                    className='preview-time-slot'
                    style={style}
                />
            );
        }

        return time_slots;
    }
}

export default class Scheduler extends Component {
    constructor(props) {
        super(props);

        this.state = {
            schedules: [],
            filtered_schedules: [],
            sorted_schedules: []
        };
    }

    dispatch_full_reschedule(props) {
        return new Promise((resolve) => {
            this.full_reschedule(props, resolve);
        });
    }

    dispatch_filter(props) {
        return new Promise((resolve) => {
            this.setState((state) => {
                const filtered_schedules = this._filter(state.schedules, props.filter);

                return {
                    filtered_schedules,
                    sorted_schedules: Util.sort_schedules(props.mode, filtered_schedules)
                };
            }, resolve);
        });
    }

    dispatch_sort(props) {
        return new Promise((resolve) => {
            this.setState((state) => ({
                sorted_schedules: Util.sort_schedules(props.mode, state.schedules)
            }), resolve);
        });
    }

    full_reschedule(props, callback) {
        if (!props)
            props = this.props;

        let schedules = Util.schedule(props.courses);
        let filtered_schedules = this._filter(schedules, props.filter);

        this.setState({
            schedules,
            filtered_schedules,
            sorted_schedules: Util.sort_schedules(props.mode, filtered_schedules)
        }, callback);
    }

    _filter(schedules, filter) {
        let ret = schedules; // ref

        if (filter.online)
            ret = ret.filter((schedules) => !schedules.some((course) => course.online));

        return ret;
    }

    componentDidMount() {
        this.full_reschedule();
        this.forceUpdate();
    }

    shouldComponentUpdate(next_props, next_state) {
        console.log(this.props, next_props, Util.shallow_equality(this.props.filter, next_props.filter));
        // The more possible schedules there are, the more expensive it is to
        // render the scheduler. To prevent unnecessary renders, we only render
        // once the scheduler is done generating a new set of schedules.
        const has_same_courses = Object.keys(this.props.courses).every((prop) => next_props.courses.hasOwnProperty(prop)) &&
                                Object.keys(next_props.courses).every((prop) => this.props.courses.hasOwnProperty(prop));
        if (!has_same_courses || this.props.term !== next_props.term)
            this.dispatch_full_reschedule(next_props).then(() => this.forceUpdate());
        else if (this.props.mode !== next_props.mode)
            this.dispatch_sort(next_props).then(() => this.forceUpdate());
        else if (!Util.shallow_equality(this.props.filter, next_props.filter))
            this.dispatch_filter(next_props).then(() => this.forceUpdate());

        return false;
    }

    render() {
        let i = 0;

        // TODO: windowing/infinite scroll?
        const human_schedules = this.state.sorted_schedules.map((schedule) => (
            <CalendarPreview
                key={`schedule${i}`}
                id={`schedule${++i}`}
                schedule={schedule}
                onSchedule={this.props.onSchedule}
            />
        ));

        console.log(`PERF: displaying ${human_schedules.length} schedules`);

        return (
            <div className='scheduler'>
                {human_schedules.length === 0 ? 'No schedules could be created with the given courses and filters.' : human_schedules}
            </div>
        );
    }
}
