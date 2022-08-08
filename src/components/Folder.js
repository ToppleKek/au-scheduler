import { Children, Component } from 'react';
import Fold from './Fold';
import './style/Folder.css';

const FolderHeader = ({ name, onClick }) => {
    const on_click = () => {
        onClick(name);
    };

    return (
        <div className='fold-header' onClick={on_click}>{name}</div>
    );
};

export default class Folder extends Component {
    constructor(props) {
        super(props);

        const folds = {};
        let first = true;
        Children.forEach(this.props.children, (child, index) => {
            if (child.type !== Fold) {
                console.log('WARN: only Fold elements should be placed in a Folder');
                return;
            }

            folds[child.props.name] = first;
            first = false;
        });

        this.state = {
            folds
        };
    }

    on_fold_expand = (name) => {
        this.setState((state, props) => {
            if (state.folds[name])
                return;

            const copy = { ...state.folds };
            copy[name] = true;

            for (const k in copy) {
                if (k === name)
                    continue;

                copy[k] = false;
            }

            return {
                folds: copy
            };
        });
    }

    render() {
        return (
            <div className='folder'>
                {
                    Children.map(this.props.children, (child) => <>
                        <FolderHeader name={child.props.name} onClick={this.on_fold_expand} />
                        {this.state.folds[child.props.name] ? child : null}
                    </>)
                }
            </div>
        );
    }
}
