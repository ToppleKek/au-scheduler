import { Component } from 'react';
import './Selector.css';

export default class Selector extends Component {
    value_change = (event) => {
        this.props.onChange(event.target.value);
    }

    render() {
        const options = this.props.options.map((option) =>
            <option value={option.value} key={option.key}>{option.name}</option>
        );

        return (
            <div className='generic-select'>
                <select value={this.props.value} onChange={this.value_change}>
                    {options}
                </select>
            </div>
        );
    }
}
