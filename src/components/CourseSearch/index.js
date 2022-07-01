import { Component } from 'react';
import './CourseSearch.css';

export default class CourseSearch extends Component {
    value_changed = (event) => {
        this.props.onChange(event.target.value);
    }

    render() {
        return (
            <div className='course-search'>
                <input type='text' placeholder='Search courses...' onChange={this.value_changed} />
            </div>
        );
    }
}
