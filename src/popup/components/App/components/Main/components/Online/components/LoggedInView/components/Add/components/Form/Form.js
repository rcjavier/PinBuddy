import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

import { postsAdd } from "redux-popup/actions/posts";
import { Input, Button, Checkbox } from "theme";
import "./Form.css";

export class Form extends Component {
  state = {
    title: "",
    url: "",
    description: "",
    tags: "",
    privatePost: false,
    readLater: false,
    previouslySaved: false
  };

  componentDidMount() {
    chrome.tabs.query(
      {
        active: true,
        currentWindow: true
      },
      result => {
        const { title, url } = result[0];

        chrome.storage.local.get(["posts"], result => {
          const postExists = result.posts.find(post => post.href === url);
          if (postExists) {
            const {
              description: title,
              extended: description,
              tags,
              shared,
              toread
            } = postExists;
            this.setState({
              title,
              url,
              description,
              tags,
              privatePost: shared === "no",
              readLater: toread === "yes",
              previouslySaved: true
            });
          } else {
            this.setState({
              title,
              url
            });

            if (!url.includes("chrome.google.com")) {
              chrome.tabs.executeScript(
                { code: "window.getSelection().toString()" },
                selection => {
                  if (selection) {
                    this.setState({
                      description: selection[0]
                    });
                  }
                }
              );
            }

            chrome.storage.sync.get(
              ["privateCheckboxByDefault", "toReadChecboxByDefault"],
              result => {
                this.setState({
                  privatePost: result.privateCheckboxByDefault,
                  readLater: result.toReadChecboxByDefault
                });
              }
            );
          }
        });
      }
    );

    window.addEventListener("keydown", this.handleKeydown);
  }

  componentWillUnmount() {
    window.removeEventListener("keydown", this.handleKeydown);
  }

  render() {
    const formInvalid =
      this.state.title.length > 255 ||
      this.state.description.length > 65536 ||
      this.state.tags.length > 255;

    return (
      <div className="form">
        <Input
          id="title"
          label={chrome.i18n.getMessage("popupAddTitleLabel")}
          placeholder={chrome.i18n.getMessage("popupAddTitleLabel")}
          value={this.state.title}
          onChange={this.handleInputChange}
          pattern=".{1,255}"
          invalidMessage={chrome.i18n.getMessage("popupAddTitleInvalidMessage")}
        />

        <Input
          id="description"
          label={chrome.i18n.getMessage("popupAddDescriptionLabel")}
          placeholder={chrome.i18n.getMessage("popupAddDescriptionLabel")}
          value={this.state.description}
          onChange={this.handleInputChange}
          pattern=".{1,65536}"
          invalidMessage={chrome.i18n.getMessage(
            "popupAddDescriptionInvalidMessage"
          )}
        />

        <Input
          id="tags"
          label={chrome.i18n.getMessage("popupAddTagsLabel")}
          placeholder={chrome.i18n.getMessage("popupAddTagsLabel")}
          value={this.state.tags}
          onChange={this.handleInputChange}
          pattern=".{1,255}"
          invalidMessage={chrome.i18n.getMessage("popupAddTagsInvalidMessage")}
          autoFocus
        />

        <div className="form__options">
          <div className="form__option">
            <Checkbox
              id="privatePost"
              label={chrome.i18n.getMessage("popupAddPrivateCheckboxLabel")}
              checked={this.state.privatePost}
              onChange={this.handleCheckboxChange}
            />
          </div>
          <div className="form__option">
            <Checkbox
              id="readLater"
              label={chrome.i18n.getMessage("popupAddReadLaterCheckboxLabel")}
              checked={this.state.readLater}
              onChange={this.handleCheckboxChange}
            />
          </div>
        </div>

        <Button
          t={
            this.state.previouslySaved
              ? chrome.i18n.getMessage("popupReAddBookmarkButton")
              : chrome.i18n.getMessage("popupAddBookmarkButton")
          }
          title={`${chrome.i18n.getMessage("popupAddBookmarkButton")} ${
            navigator.platform === "MacIntel" ? "(⌘ + Enter)" : "(Ctrl + Enter)"
          }`}
          disabled={formInvalid}
          onClick={this.handleButtonClick}
          secondary={this.state.previouslySaved}
        />
      </div>
    );
  }

  handleInputChange = e => {
    const { id, value } = e.target;
    this.setState({
      [id]: value
    });
  };

  handleCheckboxChange = e => {
    const { id, checked } = e.target;
    this.setState({
      [id]: checked
    });
  };

  handleButtonClick = () => {
    this.setState({
      laoding: true
    });
    this.props.postsAdd(this.state);
  };

  handleKeydown = e => {
    // ⌘ + Enter
    if (e.keyCode === 13 && (e.ctrlKey || e.metaKey)) {
      this.props.postsAdd(this.state);
    }
  };
}

Form.propTypes = {
  postsAdd: PropTypes.func.isRequired
};

const mapDispatchToProps = dispatch => ({
  postsAdd: postInfo => dispatch(postsAdd(postInfo))
});

export default connect(
  null,
  mapDispatchToProps
)(Form);
