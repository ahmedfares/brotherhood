import React, { Component } from "react";

import withStyles from "@material-ui/core/styles/withStyles";
import MenuItem from "@material-ui/core/MenuItem";
import Grid from "@material-ui/core/Grid";
import Select from "@material-ui/core/Select";
import CircularProgress from "@material-ui/core/CircularProgress";
import { Stack, Animation } from "@devexpress/dx-react-chart";
import Paper from "@material-ui/core/Paper";
import {
  Legend,
  ArgumentAxis,
  ValueAxis,
  BarSeries,
  LineSeries,
  Tooltip,
} from "@devexpress/dx-react-chart-material-ui";
import { EventTracker, HoverState } from "@devexpress/dx-react-chart";

import {
  Chart,
  Title,
  PieSeries,
} from "@devexpress/dx-react-chart-material-ui";

import axios from "axios";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { authMiddleWare } from "../util/auth";

const Root = (props) => (
  <Legend.Root
    {...props}
    sx={{ display: "flex", margin: "auto", flexDirection: "row" }}
  />
);
const Label = (props) => (
  <Legend.Label {...props} sx={{ whiteSpace: "nowrap" }} />
);

const styles = (theme) => ({
  inputcontainer: {
    marginBottom: "10px",
  },
  content: {
    flexGrow: 1,
    padding: theme.spacing(3),
  },
  toolbar: theme.mixins.toolbar,
  title: {
    marginLeft: theme.spacing(2),
    flex: 1,
  },
  submitButton: {
    display: "block",
    color: "white",
    textAlign: "center",
    position: "absolute",
    top: 14,
    right: 10,
  },
  floatingButton: {
    position: "fixed",
    bottom: 0,
    right: 0,
  },
  root: {
    minWidth: 470,
  },
  bullet: {
    display: "inline-block",
    margin: "0 2px",
    transform: "scale(0.8)",
  },
  pos: {
    marginBottom: 12,
  },
  uiProgess: {
    position: "fixed",
    zIndex: "1000",
    height: "31px",
    width: "31px",
    left: "50%",
    top: "35%",
  },
  dialogeStyle: {
    maxWidth: "50%",
  },
  viewRoot: {
    margin: 0,
    padding: theme.spacing(2),
  },
  closeButton: {
    position: "absolute",
    right: theme.spacing(1),
    top: theme.spacing(1),
    color: theme.palette.grey[500],
  },
});

class Dashboard extends Component {
  constructor(props) {
    super(props);

    this.state = {
      todos: [],
      payments: [],
      selectedPayments: [],
      yearPayments: [],
      paymentBy: "",
      description: "",
      category: "",
      amount: "",
      categories: [],
      owners: [],
      title: "",
      body: "",
      todoId: "",
      errors: [],
      open: false,
      uiLoading: true,
      selectedOwner: 0,
      selectedMonth: 0,
      selectedYear: 2,
      selectedChart: 0,
      selectedCategory: 0,
      buttonType: "",
      viewOpen: false,
    };
  }

  handleChange = (event) => {
    this.setState({
      [event.target.name]: event.target.value,
    });
  };

  handleOwnerSelectChange = (event) => {
    this.setState({
      selectedOwner: event.target.value,
      name: event.target.name,
    });
  };

  handleCategorySelectChange = (event) => {
    this.setState({
      selectedCategory: event.target.value,
      name: event.target.name,
    });
  };

  handleMonthChange = (event) => {
    this.setState(
      {
        selectedMonth: event.target.value,
      },
      () => {
        this.handleDateSelectChange();
      }
    );
  };

  handleChartChange = (event) => {
    this.setState({
      selectedChart: event.target.value,
    });
  };

  handleYearChange = (event) => {
    this.setState(
      {
        selectedYear: event.target.value,
      },
      () => {
        this.handleDateSelectChange();
      }
    );
  };

  handleDateSelectChange = () => {
    this.setState(
      {
        selectedPayments: this.state.payments.filter(
          (x) =>
            (new Date(x.TransactionDate).getMonth() + 1 ===
              this.state.selectedMonth ||
              this.state.selectedMonth === 0) &&
            new Date(x.TransactionDate).getFullYear() - 2020 ===
              this.state.selectedYear
        ),
        yearPayments: this.state.payments.filter(
          (x) =>
            new Date(x.TransactionDate).getFullYear() - 2020 ===
            this.state.selectedYear
        ),
      },
      () => {
        console.log(this.state.yearPayments);
      }
    );
  };

  componentWillMount = () => {
    authMiddleWare(this.props.history);
    const authToken = localStorage.getItem("AuthToken");
    axios.defaults.headers.common = { Authorization: `${authToken}` };
    axios
      .get(
        "https://us-central1-brotherhood-edc8d.cloudfunctions.net/api/payments"
      )
      .then((response) => {
        this.setState({
          payments: response.data,
          uiLoading: false,
          selectedYear: new Date().getFullYear() - 2020,
          selectedMonth: new Date().getMonth() + 1,
        });
        this.handleDateSelectChange();
      })
      .catch((err) => {
        console.log(err);
      });

    axios
      .get(
        "https://us-central1-brotherhood-edc8d.cloudfunctions.net/api/owners"
      )
      .then((response) => {
        this.setState({
          owners: response.data,
          uiLoading: false,
        });
      })
      .catch((err) => {
        console.log(err);
      });
    axios
      .get(
        "https://us-central1-brotherhood-edc8d.cloudfunctions.net/api/collections"
      )
      .then((response) => {
        this.setState({
          categories: response.data,
          uiLoading: false,
        });
      })
      .catch((err) => {
        console.log(err);
      });
  };

  renderCategoryOptions() {
    var categorySelect = [
      ...[{ collectionId: 0, collectionName: "Select a Category" }],
      ...this.state.categories,
    ];
    return categorySelect.map((dt, i) => {
      //console.log(dt);
      return (
        <MenuItem
          label="Select a category"
          value={dt.collectionId}
          key={i}
          name={dt.collectionName}
        >
          {dt.collectionName}
        </MenuItem>
      );
    });
  }

  renderOwnerOptions() {
    var categorySelect = [
      ...[{ ownerId: 0, ownerName: "Select Owner" }],
      ...this.state.owners,
    ];
    return categorySelect.map((dt, i) => {
      //console.log(dt);
      return (
        <MenuItem
          label="Select owner"
          value={dt.ownerId}
          key={i}
          name={dt.ownerName}
        >
          {dt.ownerName}
        </MenuItem>
      );
    });
  }

  renderMonthOptions() {
    var monthSelect = [
      { monthId: 0, monthName: "All" },
      { monthId: 1, monthName: "January" },
      { monthId: 2, monthName: "February" },
      { monthId: 3, monthName: "March" },
      { monthId: 4, monthName: "April" },
      { monthId: 5, monthName: "May" },
      { monthId: 6, monthName: "June" },
      { monthId: 7, monthName: "July" },
      { monthId: 8, monthName: "August" },
      { monthId: 9, monthName: "September" },
      { monthId: 10, monthName: "October" },
      { monthId: 11, monthName: "November" },
      { monthId: 12, monthName: "December" },
    ];
    return monthSelect.map((dt, i) => {
      //console.log(dt);
      return (
        <MenuItem label="All" value={dt.monthId} key={i} name={dt.monthName}>
          {dt.monthName}
        </MenuItem>
      );
    });
  }

  renderYearOptions() {
    var yearSelect = [
      { Id: 0, yearName: "2020" },
      { Id: 1, yearName: "2021" },
      { Id: 2, yearName: "2022" },
      { Id: 3, yearName: "2023" },
      { Id: 4, yearName: "2024" },
      { Id: 5, yearName: "2025" },
      { Id: 6, yearName: "2026" },
    ];
    return yearSelect.map((dt, i) => {
      //console.log(dt);
      return (
        <MenuItem label="Select year" value={dt.Id} key={i} name={dt.yearName}>
          {dt.yearName}
        </MenuItem>
      );
    });
  }

  renderChartOptions() {
    var chartSelect = [
      { Id: 0, chartName: "Categories Chart 1" },
      { Id: 1, chartName: "Owners Chart 1" },
      { Id: 2, chartName: "Categories Chart 2" },
      { Id: 3, chartName: "Owners Chart 2" },
      { Id: 4, chartName: "Month Chart 1" },
      { Id: 5, chartName: "Month Chart 2" },
    ];
    return chartSelect.map((dt, i) => {
      return (
        <MenuItem
          label="Select chart"
          value={dt.Id}
          key={i}
          name={dt.chartName}
        >
          {dt.chartName}
        </MenuItem>
      );
    });
  }

  render() {
    dayjs.extend(relativeTime);
    const { classes } = this.props;
    const { errors } = this.state;

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
      const categoryData = [];
      const ownerData = [];
      const monthData = [];
      let totalPayments = 0;
      const chartData = [];

      const months = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];

      if (
        this.state.owners.length > 0 &&
        this.state.categories.length > 0 &&
        this.state.payments.length > 0
      ) {
        this.state.selectedPayments
          .map((obj) => ({
            ...obj,
            CategoryName: this.state.categories.find(
              (x) => x.collectionId == obj.Category
            ).collectionName,
          }))
          .reduce(function (res, value) {
            if (!res[value.CategoryName]) {
              res[value.CategoryName] = {
                category: value.CategoryName,
                payment: value.Amount,
                expected:
                  value.CategoryName == "Rent"
                    ? 1200
                    : value.CategoryName == "Charity"
                    ? 1200
                    : value.CategoryName == "Food"
                    ? 500
                    : value.CategoryName == "Electricity"
                    ? 100
                    : value.CategoryName == "Internet"
                    ? 40
                    : value.CategoryName == "Insurance"
                    ? 75
                    : value.CategoryName == "Expenses"
                    ? 285
                    : value.CategoryName == "Fuel"
                    ? 100
                    : 0,
              };
              chartData.push(res[value.CategoryName]);
            }
            res[value.CategoryName].Amount =
              Number(value.Amount) +
              (res[value.CategoryName].Amount
                ? Number(res[value.CategoryName].Amount)
                : 0);
            res[value.CategoryName].payment = res[value.CategoryName].Amount;
            return res;
          }, {});

        this.state.selectedPayments
          .map((obj) => ({
            ...obj,
            OwnerName: this.state.owners.find(
              (x) => x.ownerId == obj.TransactionBy
            ).ownerName,
          }))
          .reduce(function (res, value) {
            if (!res[value.OwnerName]) {
              res[value.OwnerName] = {
                owner: value.OwnerName,
                value: value.Amount,
              };
              ownerData.push(res[value.OwnerName]);
            }
            res[value.OwnerName].Amount =
              Number(value.Amount) +
              (res[value.OwnerName].Amount
                ? Number(res[value.OwnerName].Amount)
                : 0);
            res[value.OwnerName].value = res[value.OwnerName].Amount;
            res[value.OwnerName].expected = 1750;
            return res;
          }, {});

        this.state.yearPayments
          .map((obj) => ({
            ...obj,
            MonthName: months.find(
              (x, index) => index == new Date(obj.TransactionDate).getMonth()
            ),
          }))
          .reduce(function (res, value) {
            if (!res[value.MonthName]) {
              res[value.MonthName] = {
                Month: value.MonthName,
                value: value.Amount,
              };
              monthData.push(res[value.MonthName]);
            }
            res[value.MonthName].Amount =
              Number(value.Amount) +
              (res[value.MonthName].Amount
                ? Number(res[value.MonthName].Amount)
                : 0);
            res[value.MonthName].value = res[value.MonthName].Amount;
            return res;
          }, {});

        console.log(monthData);

        totalPayments = this.state.selectedPayments.reduce(
          (accumulator, value) => {
            return accumulator + parseFloat(value.Amount);
          },
          0
        );
      }
      return (
        <div>
          <div className={classes.toolbar} />
          <Grid container spacing={2}>
            <Grid item xs={12} md={4} className={classes.inputcontainer}>
              <Select
                variant="outlined"
                required
                fullWidth
                id="paymentMonth"
                label="paymentMonth"
                name="paymentMonth"
                autoComplete="paymentMonth"
                helperText={errors.paymentMonth}
                value={this.state.selectedMonth}
                onChange={this.handleMonthChange}
              >
                {this.renderMonthOptions()}
              </Select>
            </Grid>
            <Grid item xs={12} md={3} className={classes.inputcontainer}>
              <Select
                variant="outlined"
                required
                fullWidth
                id="paymentYear"
                label="paymentYear"
                name="paymentYear"
                autoComplete="paymentYear"
                helperText={errors.paymentYear}
                value={this.state.selectedYear}
                onChange={this.handleYearChange}
              >
                {this.renderYearOptions()}
              </Select>
            </Grid>
            <Grid item xs={12} md={5} className={classes.inputcontainer}>
              <Select
                variant="outlined"
                required
                fullWidth
                id="paymentChart"
                label="paymentChart"
                name="paymentChart"
                autoComplete="paymentChart"
                helperText={errors.paymentChart}
                value={this.state.selectedChart}
                onChange={this.handleChartChange}
              >
                {this.renderChartOptions()}
              </Select>
            </Grid>
          </Grid>
          {this.state.selectedChart === 0 && (
            <Paper>
              <Chart data={chartData}>
                <ArgumentAxis />
                <ValueAxis />

                <BarSeries
                  name="Actual Payments"
                  valueField="payment"
                  argumentField="category"
                  color="orange"
                />
                <BarSeries
                  name="Expected Payments"
                  valueField="expected"
                  argumentField="category"
                  color="green"
                />
                <Animation />
                <Legend
                  position="bottom"
                  rootComponent={Root}
                  labelComponent={Label}
                />
                <h4 style={{ textAlign: "center" }}>
                  {" "}
                  Payments vs Expected per Category Total: {totalPayments}{" "}
                </h4>
                <Stack />
                <EventTracker />
                <Tooltip />
              </Chart>
            </Paper>
          )}
          {this.state.selectedChart === 1 && (
            <Paper>
              <Chart data={ownerData}>
                <ArgumentAxis />
                <ValueAxis />

                <BarSeries
                  name="Actual Payments"
                  valueField="value"
                  argumentField="owner"
                  color="orange"
                />
                <BarSeries
                  name="Expected Payments"
                  valueField="expected"
                  argumentField="owner"
                  color="green"
                />
                <Animation />
                <Legend
                  position="bottom"
                  rootComponent={Root}
                  labelComponent={Label}
                />
                <Title text="Actual Payment vs Expected Payment per owner" />
                <Stack />
                <EventTracker />
                <Tooltip />
              </Chart>
            </Paper>
          )}
          {this.state.selectedChart === 2 && (
            <Paper>
              <Chart data={chartData}>
                <PieSeries valueField="payment" argumentField="category" />
                <Legend
                  position="left"
                  rootComponent={Root}
                  labelComponent={Label}
                />
                <Title text="Payments per category" />
                <Animation />
                <EventTracker />
                <Tooltip />
              </Chart>
            </Paper>
          )}
          {this.state.selectedChart === 3 && (
            <Paper>
              <Chart data={ownerData}>
                <PieSeries valueField="value" argumentField="owner" />
                <Legend
                  position="left"
                  rootComponent={Root}
                  labelComponent={Label}
                />
                <Title text="Payments per owner" />
                <Animation />
                <EventTracker />
                <Tooltip />
              </Chart>
            </Paper>
          )}
          {this.state.selectedChart === 4 && (
            <Paper>
              <Chart data={monthData}>
                <ArgumentAxis />
                <ValueAxis />

                <BarSeries
                  name="Actual Payments"
                  valueField="value"
                  argumentField="Month"
                />
                <Animation />
                <Legend
                  position="bottom"
                  rootComponent={Root}
                  labelComponent={Label}
                />
                <Title text="Actual Payment vs Expected Payment per category" />
                <Stack />
                <EventTracker />
                <Tooltip />
              </Chart>
            </Paper>
          )}
          {this.state.selectedChart === 5 && (
            <Paper>
              <Chart data={monthData}>
                <ArgumentAxis />
                <ValueAxis />

                <LineSeries
                  name="Actual Payments"
                  valueField="value"
                  argumentField="Month"
                />
                <Animation />
                <Legend
                  position="bottom"
                  rootComponent={Root}
                  labelComponent={Label}
                />
                <Title text="Actual Payment vs Expected Payment per category" />
                <Stack />
                <EventTracker />
                <Tooltip />
              </Chart>
            </Paper>
          )}
        </div>
      );
    }
  }
}

export default withStyles(styles)(Dashboard);
