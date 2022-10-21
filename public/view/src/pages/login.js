import React, { Component } from "react";
import Avatar from "@material-ui/core/Avatar";
import Button from "@material-ui/core/Button";
import CssBaseline from "@material-ui/core/CssBaseline";
import TextField from "@material-ui/core/TextField";
import Link from "@material-ui/core/Link";
import Grid from "@material-ui/core/Grid";
import LockOutlinedIcon from "@material-ui/icons/LockOutlined";
import Typography from "@material-ui/core/Typography";
import withStyles from "@material-ui/core/styles/withStyles";
import Container from "@material-ui/core/Container";
import CircularProgress from "@material-ui/core/CircularProgress";

import axios from "axios";

const styles = (theme) => ({
  paper: {
    marginTop: theme.spacing(8),
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  avatar: {
    margin: theme.spacing(1),
    backgroundColor: theme.palette.secondary.main,
  },
  form: {
    width: "100%",
    marginTop: theme.spacing(1),
  },
  submit: {
    margin: theme.spacing(3, 0, 2),
  },
  customError: {
    color: "red",
    fontSize: "0.8rem",
    marginTop: 10,
  },
  progess: {
    position: "absolute",
  },
});

class login extends Component {
  constructor(props) {
    super(props);

    this.state = {
      email: "",
      password: "",
      errors: [],
      loading: false,
    };
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.UI.errors) {
      this.setState({
        errors: nextProps.UI.errors,
      });
    }
  }

  handleChange = (event) => {
    this.setState({
      [event.target.name]: event.target.value,
    });
  };

  handleSubmit = (event) => {
    event.preventDefault();
    this.setState({ loading: true });
    const userData = {
      email: this.state.email,
      password: this.state.password,
    };
    axios
      .post(
        "https://us-central1-brotherhood-edc8d.cloudfunctions.net/api/login",
        userData
      )
      .then((response) => {
        localStorage.setItem("AuthToken", `Bearer ${response.data.token}`);
        this.setState({
          loading: false,
        });
        this.props.history.push("/");
      })
      .catch((error) => {
        this.setState({
          errors: error.response.data,
          loading: false,
        });
      });
  };

  render() {
    const { classes } = this.props;
    const { errors, loading } = this.state;
    return (
      <Container component="main" maxWidth="xs">
        <div id="bg"></div>
        <div>
          <form>
            <img
              style={{
                zIndex: 1000,
                width: "350px",
                height: "100px",
                marginBottom: "60px",
              }}
              src="logo.png"
              alt="logo"
            />
            <div class="form-field">
              <input
                id="email"
                name="email"
                autoComplete="email"
                type="email"
                placeholder="Email / Username"
                onChange={this.handleChange}
                required
              />
            </div>

            <div class="form-field">
              <input
                id="password"
                name="password"
                autoComplete="password"
                type="password"
                placeholder="Password"
                required
                onChange={this.handleChange}
              />{" "}
            </div>

            <div class="form-field">
              <button
                class="btn"
                type="submit"
                onClick={this.handleSubmit}
                disabled={loading || !this.state.email || !this.state.password}
              >
                Log in
              </button>
            </div>
          </form>
        </div>
      </Container>
    );
  }
}

export default withStyles(styles)(login);
