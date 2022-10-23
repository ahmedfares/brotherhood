import React, { Component } from "react";

import withStyles from "@material-ui/core/styles/withStyles";
import Typography from "@material-ui/core/Typography";
import CircularProgress from "@material-ui/core/CircularProgress";
import CloudUploadIcon from "@material-ui/icons/CloudUpload";
import {
  Card,
  CardActions,
  CardContent,
  Divider,
  Button,
  Grid,
  TextField,
  Avatar,
} from "@material-ui/core";

import clsx from "clsx";

import axios from "axios";
import { authMiddleWare } from "../util/auth";

const styles = (theme) => ({
  content: {
    flexGrow: 1,
    padding: theme.spacing(3),
  },
  actions: {
    display: "flex",
    padding: "8px",
    justifyContent: "right",
  },
  row: {
    marginBottom: "20px",
  },
  toolbar: theme.mixins.toolbar,
  root: {},
  details: {
    display: "flex",
  },
  avatar: {
    height: 110,
    width: 100,
    flexShrink: 0,
    flexGrow: 0,
  },
  locationText: {
    paddingLeft: "15px",
  },
  buttonProperty: {
    position: "absolute",
    top: "50%",
  },
  uiProgess: {
    position: "fixed",
    zIndex: "1000",
    height: "31px",
    width: "31px",
    left: "50%",
    top: "35%",
  },
  progess: {
    position: "absolute",
  },
  uploadButton: {
    marginLeft: "8px",
    margin: theme.spacing(1),
  },
  customError: {
    color: "red",
    fontSize: "0.8rem",
    marginTop: 10,
  },
  submitButton: {
    marginTop: "0px",
  },
});

class account extends Component {
  constructor(props) {
    super(props);

    this.state = {
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      username: "",
      country: "",
      profilePicture: "",
      uiLoading: true,
      buttonLoading: false,
      imageError: "",
    };
  }

  componentWillMount = () => {
    authMiddleWare(this.props.history);
    const authToken = localStorage.getItem("AuthToken");
    axios.defaults.headers.common = { Authorization: `${authToken}` };
    axios
      .get("https://us-central1-brotherhood-edc8d.cloudfunctions.net/api/user")
      .then((response) => {
        console.log(response.data);
        this.setState({
          firstName: response.data.userCredentials.firstName,
          lastName: response.data.userCredentials.lastName,
          email: response.data.userCredentials.email,
          phoneNumber: response.data.userCredentials.phoneNumber,
          country: response.data.userCredentials.country,
          username: response.data.userCredentials.username,
          uiLoading: false,
        });
      })
      .catch((error) => {
        if (error.response.status === 403) {
          this.props.history.push("/login");
        }
        console.log(error);
        this.setState({ errorMsg: "Error in retrieving the data" });
      });
  };

  handleChange = (event) => {
    this.setState({
      [event.target.name]: event.target.value,
    });
  };

  handleImageChange = (event) => {
    this.setState({
      image: event.target.files[0],
    });
  };

  profilePictureHandler = (event) => {
    event.preventDefault();
    this.setState({
      uiLoading: true,
    });
    authMiddleWare(this.props.history);
    const authToken = localStorage.getItem("AuthToken");
    let form_data = new FormData();
    form_data.append("image", this.state.image);
    form_data.append("content", this.state.content);
    axios.defaults.headers.common = { Authorization: `${authToken}` };
    axios
      .post(
        "https://us-central1-brotherhood-edc8d.cloudfunctions.net/api/user/image",
        form_data,
        {
          headers: {
            "content-type": "multipart/form-data",
          },
        }
      )
      .then(() => {
        window.location.reload();
      })
      .catch((error) => {
        if (error.response.status === 403) {
          this.props.history.push("/login");
        }
        console.log(error);
        this.setState({
          uiLoading: false,
          imageError: "Error in posting the data",
        });
      });
  };

  updateFormValues = (event) => {
    event.preventDefault();
    this.setState({ buttonLoading: true });
    authMiddleWare(this.props.history);
    const authToken = localStorage.getItem("AuthToken");
    axios.defaults.headers.common = { Authorization: `${authToken}` };
    const formRequest = {
      firstName: this.state.firstName,
      lastName: this.state.lastName,
      country: this.state.country,
    };
    axios
      .post(
        "https://us-central1-brotherhood-edc8d.cloudfunctions.net/api/user",
        formRequest
      )
      .then(() => {
        this.setState({ buttonLoading: false });
      })
      .catch((error) => {
        if (error.response.status === 403) {
          this.props.history.push("/login");
        }
        console.log(error);
        this.setState({
          buttonLoading: false,
        });
      });
  };

  render() {
    const { classes, ...rest } = this.props;
    if (this.state.uiLoading === true) {
      return (
        <main className={classes.content}>
          <div className={classes.toolbar} />
          {this.state.uiLoading && (
            <CircularProgress size={150} className={classes.uiProgess} />
          )}
        </main>
      );
    } else {
      return (
        <main className={classes.content}>
          <div className={classes.toolbar} />
          <div className="row">
            <div className="col-md-1 col-sm-12"></div>
            <div className="col-md-4 col-sm-12">
              <Card className={classes.row}>
                <CardContent>
                  <div class="card-body text-center">
                    <img
                      src={sessionStorage.getItem("profilePicture")}
                      alt="avatar"
                      class="rounded-circle img-fluid"
                      style={{ width: "150px" }}
                    ></img>
                    <h5 class="my-3">
                      {this.state.firstName} {this.state.lastName}
                    </h5>
                    <p class="text-muted mb-1">{this.state.email}</p>
                    <p class="text-muted mb-4">{this.state.phoneNumber}</p>
                    <input
                      type="file"
                      class="form-control"
                      onChange={this.handleImageChange}
                    />
                    <button
                      type="button"
                      class="btn btn-primary"
                      style={{ "margin-top": "10px" }}
                      onClick={this.profilePictureHandler}
                    >
                      Upload Photo
                    </button>
                  </div>
                  <div className={classes.progress} />
                </CardContent>
                <Divider />
              </Card>
            </div>
            <div className="col-md-6 col-sm-12">
              <Card {...rest} className={clsx(classes.root, classes)}>
                <form autoComplete="off" noValidate>
                  <Divider />
                  <CardContent>
                    <Grid container spacing={3}>
                      <Grid item md={4} xs={4}>
                        <p class="mb-0">First Name</p>
                      </Grid>
                      <Grid item md={8} xs={8}>
                        <input
                          type="text"
                          name="firstName"
                          value={this.state.firstName}
                          onChange={this.handleChange}
                          className="form-control"
                        />
                      </Grid>
                      <Grid item md={4} xs={4}>
                        <p class="mb-0">Last Name</p>
                      </Grid>
                      <Grid item md={8} xs={8}>
                        <input
                          type="text"
                          name="lastName"
                          value={this.state.lastName}
                          onChange={this.handleChange}
                          className="form-control"
                        />
                      </Grid>
                      <Grid item md={4} xs={4}>
                        <p class="mb-0">Email</p>
                      </Grid>
                      <Grid item md={8} xs={8}>
                        <input
                          type="text"
                          name="email"
                          value={this.state.email}
                          onChange={this.handleChange}
                          className="form-control"
                        />
                      </Grid>
                      <Grid item md={4} xs={4}>
                        <p class="mb-0">Phone Number</p>
                      </Grid>
                      <Grid item md={8} xs={8}>
                        <input
                          type="text"
                          name="phoneNumber"
                          value={this.state.phoneNumber}
                          onChange={this.handleChange}
                          className="form-control"
                        />
                      </Grid>
                      <Grid item md={4} xs={4}>
                        <p class="mb-0">Username</p>
                      </Grid>
                      <Grid item md={8} xs={8}>
                        <input
                          type="text"
                          name="email"
                          value={this.state.username}
                          onChange={this.handleChange}
                          className="form-control"
                          disabled
                        />
                      </Grid>
                      <Grid item md={4} xs={4}>
                        <p class="mb-0">Country</p>
                      </Grid>
                      <Grid item md={8} xs={8}>
                        <input
                          type="text"
                          name="country"
                          value={this.state.country}
                          onChange={this.handleChange}
                          className="form-control"
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                  <Divider />
                  <CardActions className={classes.actions}>
                    <Button
                      color="primary"
                      variant="contained"
                      type="submit"
                      className={classes.submitButton}
                      onClick={this.updateFormValues}
                      disabled={
                        this.state.buttonLoading ||
                        !this.state.firstName ||
                        !this.state.lastName ||
                        !this.state.country
                      }
                    >
                      Save details
                      {this.state.buttonLoading && (
                        <CircularProgress
                          size={30}
                          className={classes.progess}
                        />
                      )}
                    </Button>
                  </CardActions>
                </form>
              </Card>
            </div>
          </div>

          <br />
        </main>
      );
    }
  }
}

export default withStyles(styles)(account);
