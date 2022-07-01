import { Component } from 'react';
import './Button.css';
import * as Util from '../../util';
import * as Constants from '../../constants';

export default class Button extends Component {
    clicked = (event) => {
        event.stopPropagation();
        event.preventDefault();
        this.props.onClick(this.props.value);
    }

    render() {
        // const bgc = Util.parse_colour(this.props.colour);
        // const style = {
        //     color: Constants.THEMES[Util.text_colour_from_bg(bgc.r, bgc.g, bgc.b)].text
        // };

        const class_list = `generic-button ${this.props.role}-button`;

        return (
            <div className={class_list} onClick={this.clicked}>
                {this.props.value}
            </div>
        );
    }
}
