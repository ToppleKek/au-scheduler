import { Component, createRef } from 'react';
import './Selector.css';

class Option extends Component {
    on_click = (event) => {
        event.stopPropagation();
        event.preventDefault();
        this.props.onSelect(this.props.value);
    }

    render() {
        return (
            <div className='selector-option' key={this.props.key} onClick={this.on_click}>{this.props.name}</div>
        );
    }
}

export default class Selector extends Component {
    constructor(props) {
        super(props);

        this.parent_ref = createRef();
        this.options_ref = createRef();
        this.state = { expanded: false };
    }

    option_selected = (new_value) => {
        this.props.onChange(new_value);
        this.setState({
            expanded: false,
        });
    }

    toggle = () => {
        this.setState((state) => {
            return {
                expanded: !state.expanded
            };
        })
    }

    componentDidMount() {
        document.addEventListener('mouseup', (event) => {
            if (this.options_ref.current &&
                !this.options_ref.current.contains(event.target) &&
                this.parent_ref.current &&
                !this.parent_ref.current.contains(event.target)) {
                this.setState({
                    expanded: false
                });
            }
        });
    }

    componentWillUnmount() {
        document.removeEventListener('mouseup', this.toggle);
    }

    render() {
        const options = this.props.options
            .filter((option) => option.value !== this.props.value)
            .map((option) =>
                <Option key={option.key} value={option.value} name={option.name} onSelect={this.option_selected} />
            );

        const name = this.props.options.find((option) =>
            option.value === this.props.value
        ).name;

        return (
            <div className='selector-body'>
                <div className='selector-container'>
                    <div
                        className={`selector ${this.state.expanded ? 'selector-expanded' : ''}`}
                        onClick={this.toggle}
                        ref={this.parent_ref}
                    >
                        {name}
                    </div>
                </div>

                <div className='selector-options' ref={this.options_ref}>
                    {this.state.expanded ? options : null}
                </div>
            </div>
        );
    }
}
