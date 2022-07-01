import { Component } from 'react';
import './Checkbox.css';

export default class Checkbox extends Component {
    constructor(props) {
        super(props);
        this.state = { checked: false };
    }

    on_change = (event) => {
        this.setState((state, props) => {
            props.onChange(!state.checked);

            return {
                checked: !state.checked
            };
        });
    }

    render() {
        return (
            <div className='generic-checkbox-wrapper'>
                <input type='checkbox' name={this.props.name} className='generic-checkbox' checked={this.state.checked} onChange={this.on_change} />
                <label htmlFor={this.props.name}>{this.props.label}</label>
            </div>
        );
    }
}
